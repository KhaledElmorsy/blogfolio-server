import { generateDBInserts, testData } from '@/db/test-utils';
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from 'vitest';
import { pool } from '@/db';
import { PoolClient } from 'pg';
import * as commentDB from '../comments.queries';

beforeAll(async () => {
  await pool.query(
    generateDBInserts(
      testData,
      ['users', 'nodes', 'posts', 'comments', 'emotes', 'comment_emotes'],
      {
        comments: { comment_id: true },
      },
    ),
  );
});

let client: PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK;');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe('find', () => {
  it('Finds comments by comment ID', async () => {
    const actualComment = testData.comments.at(-1);
    const [queriedComment] = await commentDB.find.run(
      { ids: [actualComment?.comment_uid as string] },
      client,
    );
    expect(queriedComment).toMatchObject({
      id: actualComment?.comment_uid, // Hopefully
      body: actualComment?.body,
    });
  });
  it('Finds comments by user ID', async () => {
    const userPK = testData.comments[0].user_id;
    const userID = testData.users.find(({ user_id }) => user_id === userPK)
      ?.user_uid;
    const actualCommentIDs = testData.comments
      .filter(({ user_id }) => user_id === userPK)
      .map(({ comment_uid }) => comment_uid)
      .sort();

    const queriedComments = await commentDB.find.run({ userID }, client);
    const queriedCommentIDs = queriedComments.map(({ id }) => id).sort();
    expect(queriedCommentIDs).toEqual(actualCommentIDs);
  });

  it('Finds comments by post ID', async () => {
    const postPK = testData.comments[0].post_id;
    const postID = testData.posts.find(({ post_id }) => post_id === postPK)
      ?.post_uid;
    const actualCommentIDs = testData.comments
      .filter(({ post_id }) => post_id === postPK)
      .map(({ comment_uid }) => comment_uid)
      .sort();

    const queriedComments = await commentDB.find.run({ postID }, client);
    const queriedCommentIDs = queriedComments.map(({ id }) => id).sort();
    expect(queriedCommentIDs).toEqual(actualCommentIDs);
  });

  it('Finds comments by post slug & username', async () => {
    const testComment = testData.comments[0];
    const { post_id: postPK, user_id: userPK } = testComment;
    const testPost = testData.posts.find((post) => post.post_id === postPK);
    const testUser = testData.users.find((user) => user.user_id === userPK);
    const queriedComments = await commentDB.find.run(
      {
        username: testUser?.username,
        slug: testPost?.slug,
      },
      client,
    );
    const queriedIDs = queriedComments.map(({ id }) => id);
    expect(queriedIDs).toContain(testComment.comment_uid);
  });

  it('Sorts and paginates comments by creation date', async () => {
    const limit = 4;
    const sortedCommentIDs = testData.comments
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf(),
      )
      .map(({ comment_uid }) => comment_uid);
    const firstPage = sortedCommentIDs.slice(0, limit);
    const secondPage = sortedCommentIDs.slice(limit, limit * 2);

    const firstPageDB = (await commentDB.find.run({ limit }, client)).map(
      ({ id }) => id,
    );
    const nextID = firstPageDB.at(-1);
    const secondPageDB = (
      await commentDB.find.run({ limit, nextID }, client)
    ).map(({ id }) => id);
    expect(firstPageDB).toEqual(firstPage);
    expect(secondPageDB).toEqual(secondPage);
  });

  it('Sorts comments by popularity (emote count)', async () => {
    const commentsWithEmotes = testData.comments
      .map((comment) => ({
        ...comment,
        emotes: testData.comment_emotes.filter(
          (emote) => emote.comment_id === comment.comment_id,
        ).length,
      }))
      .sort((a, b) =>
        (b.emotes !== a.emotes
          ? b.emotes - a.emotes
          : new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf()),
      )
      .map(({ comment_uid }) => comment_uid);

    const queriedComments = await commentDB.find.run({ popular: true }, client);
    const queriedIDs = queriedComments.map(({ id }) => id);
    expect(queriedIDs).toEqual(commentsWithEmotes);
  });
});

describe('insert', () => {
  it('Inserts comments into the table, while mapping IDs to PKs', async () => {
    const user = testData.users[0];
    const post = testData.posts[0];
    const id = 'testPostuid';
    const body = 'test comment body';
    const parentComment = testData.comments[0];

    await commentDB.insert.run(
      {
        body,
        id,
        userID: user.user_uid,
        postID: post.post_uid,
        parentID: parentComment.comment_uid,
      },
      client,
    );

    const insertedComment = (
      await client.query('SELECT * FROM comments WHERE comment_uid = $1;', [id])
    ).rows[0];

    expect(insertedComment).toMatchObject({
      parent_comment_id: parentComment.comment_id,
      comment_uid: id,
      user_id: user.user_id,
      post_id: post.post_id,
      body,
    });
  });
});

describe('update', () => {
  it('Updates the body of the comment with the passed ID', async () => {
    const comment = testData.comments[0];
    const newBody = 'test body';

    await commentDB.update.run(
      { id: comment.comment_uid, body: newBody },
      client,
    );

    const updatedComment = (
      await client.query('SELECT body FROM comments WHERE comment_uid = $1', [
        comment.comment_uid,
      ])
    ).rows[0];

    expect(updatedComment.body).toBe(newBody);
  });
});

describe('delete', () => {
  it('Deletes the comment with the passed ID', async () => {
    const comment = testData.comments[0];

    await commentDB.remove.run({ ids: [comment.comment_uid] }, client);

    const queryResult = await client.query(
      'SELECT * FROM comments WHERE comment_uid = $1',
      [comment.comment_uid],
    );

    expect(queryResult.rowCount).toBe(0);
  });
});

describe('tree', () => {
  it('Returns a comment tree based on parent comment values', async () => {
    await client.query('DELETE FROM comments;');
    await client.query('ALTER SEQUENCE comments_comment_id_seq RESTART;');
    await client.query(`
      INSERT INTO comments 
        (comment_uid, body, post_id, user_id, parent_comment_id)
      VALUES
        ('a','a', 1, 1, NULL),
        ('b','b', 1, 1, 1),
        ('c','c', 1, 1, NULL),
        ('d','d', 1, 1, 2),
        ('e','e', 1, 1, 3),
        ('f','f', 1, 1, 4),
        ('g','g', 1, 1, 6);`);
    const commentTree = await commentDB.tree.run(
      { rootCommentID: 'a', depth: 3 },
      client,
    );
    expect(commentTree).toMatchInlineSnapshot(`
      [
        {
          "id": "a",
          "parentPK": null,
          "pk": 1,
        },
        {
          "id": "b",
          "parentPK": 1,
          "pk": 2,
        },
        {
          "id": "d",
          "parentPK": 2,
          "pk": 4,
        },
        {
          "id": "f",
          "parentPK": 4,
          "pk": 6,
        },
      ]
    `);
  });
});
