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
import * as emoteDB from '../emotes.queries';

beforeAll(async () => {
  await pool.query(
    generateDBInserts(
      testData,
      [
        'users',
        'nodes',
        'posts',
        'comments',
        'emotes',
        'comment_emotes',
        'post_emotes',
      ],
      {
        comments: { comment_id: true },
        emotes: { emote_id: true },
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

describe('getEmotes', () => {
  it('Returns an array of the registered emotes in the DB', async () => {
    const queriedEmotes = await emoteDB.getEmotes.run(undefined, client);
    expect(queriedEmotes).toMatchInlineSnapshot(`
      [
        {
          "body": "👍",
          "id": 1,
        },
        {
          "body": "😊",
          "id": 2,
        },
        {
          "body": "😂",
          "id": 3,
        },
        {
          "body": "❤️",
          "id": 4,
        },
        {
          "body": "🤩",
          "id": 5,
        },
        {
          "body": "1",
          "id": 6,
        },
        {
          "body": "2",
          "id": 7,
        },
        {
          "body": "3",
          "id": 8,
        },
        {
          "body": "4",
          "id": 9,
        },
      ]
    `);
  });
});

describe('getPost', () => {
  it('Return emotes for multiple posts', async () => {
    const posts = testData.posts.slice(0, 5);
    const postEmotes = testData.post_emotes.filter(({ post_id }) =>
      posts.find((post) => post.post_id === post_id),
    );
    const postIDs = posts.map(({ post_uid }) => post_uid);
    const queryPostEmotes = await emoteDB.getPosts.run({ postIDs }, client);
    expect(postEmotes.length).toBe(queryPostEmotes.length);
    queryPostEmotes.forEach((qEmote) => {
      expect(postIDs).toContain(qEmote.postID);
    });
  });

  it('Returns emotes done by a specific user on posts', async () => {
    const posts = testData.posts.slice(0, 5);
    const postEmotes = testData.post_emotes.filter(({ post_id }) =>
      posts.find((post) => post.post_id === post_id),
    );
    const userPK = postEmotes[0].user_id;
    const postIDs = posts.map(({ post_uid }) => post_uid);
    const userID = testData.users.find(({ user_id }) => userPK === user_id)
      ?.user_uid;
    const queryPostEmotes = await emoteDB.getPosts.run(
      { userID, postIDs },
      client,
    );
    queryPostEmotes.forEach((emote) => {
      expect(emote.userID).toBe(userID);
      expect(postIDs).toContain(emote.postID);
    });
  });
});

describe('getPostCumulative', () => {
  it('Returns the number of emotes on each post', async () => {
    const posts = testData.posts.slice(0, 5);
    const postIDs = posts.map(({ post_uid }) => post_uid);
    const postCumulativeEmotes = posts.flatMap((post) => {
      const { emotes } = testData;
      const emoteCounts = emotes.flatMap((emote) => {
        const count = testData.post_emotes.filter(
          (post_emote) =>
            post_emote.emote_id === emote.emote_id
            && post_emote.post_id === post.post_id,
        ).length;
        return count ? [{ emoteID: emote.emote_id, count }] : [];
      });
      return emoteCounts.map((emoteCount) => ({
        ...emoteCount,
        postID: post.post_uid,
      }));
    });
    const queryResult = await emoteDB.getPostCumulative.run(
      { postIDs },
      client,
    );
    expect(queryResult.length).toBe(postCumulativeEmotes.length);
    expect(queryResult).toEqual(expect.arrayContaining(postCumulativeEmotes));
  });
});

describe('getComment', () => {
  it('Return emotes for multiple comments', async () => {
    const comments = testData.comments.slice(0, 5);
    const commentEmotes = testData.comment_emotes.filter(({ comment_id }) =>
      comments.find((comment) => comment.comment_id === comment_id),
    );
    const commentIDs = comments.map(({ comment_uid }) => comment_uid);
    const queryCommentEmotes = await emoteDB.getComments.run(
      { commentIDs },
      client,
    );
    expect(queryCommentEmotes.length).toBe(commentEmotes.length);
    queryCommentEmotes.forEach((qEmote) => {
      expect(commentIDs).toContain(qEmote.commentID);
    });
  });

  it('Returns emotes done by a specific user on comments', async () => {
    const comments = testData.comments.slice(0, 5);
    const commentEmotes = testData.comment_emotes.filter(({ comment_id }) =>
      comments.find((comment) => comment.comment_id === comment_id),
    );
    const userPK = commentEmotes[0].user_id;
    const commentIDs = comments.map(({ comment_uid }) => comment_uid);
    const userID = testData.users.find(({ user_id }) => userPK === user_id)
      ?.user_uid;
    const queryCommentEmotes = await emoteDB.getComments.run(
      { userID, commentIDs },
      client,
    );
    queryCommentEmotes.forEach((emote) => {
      expect(emote.userID).toBe(userID);
      expect(commentIDs).toContain(emote.commentID);
    });
  });
});

describe('getCommentCumulative', () => {
  it('Returns the number of emotes on the comments', async () => {
    const comments = testData.comments.slice(0, 5);
    const commentIDs = comments.map(({ comment_uid }) => comment_uid);
    const commentCumulativeEmotes = comments.flatMap((comment) => {
      const { emotes } = testData;
      const emoteCounts = emotes.flatMap((emote) => {
        const count = testData.comment_emotes.filter(
          (comment_emote) =>
            comment_emote.emote_id === emote.emote_id
            && comment_emote.comment_id === comment.post_id,
        ).length;
        return count ? [{ emoteID: emote.emote_id, count }] : [];
      });
      return emoteCounts.map((emoteCount) => ({
        ...emoteCount,
        commentID: comment.comment_uid,
      }));
    });
    const queryResult = await emoteDB.getCommentCumulative.run(
      { commentIDs },
      client,
    );
    expect(queryResult.length).toBe(commentCumulativeEmotes.length);
    expect(queryResult).toEqual(
      expect.arrayContaining(commentCumulativeEmotes),
    );
  });
});

describe('insertForPost', () => {
  it('Inserts an emote for a specific user & post', async () => {
    const user = testData.users[0];
    const post = testData.posts[10];
    const emote = testData.emotes[0];
    await emoteDB.insertForPost.run(
      {
        id: emote.emote_id,
        userID: user.user_uid,
        postID: post.post_uid,
      },
      client,
    );
    const newEmoteQuery = await client.query(
      'SELECT * FROM post_emotes WHERE user_id = $1 AND post_id = $2 AND emote_id = $3;',
      [user.user_id, post.post_id, emote.emote_id],
    );
    expect(newEmoteQuery.rowCount).toBeGreaterThan(0);
  });
});

describe('insertForComment', () => {
  it('Inserts an emote for a specific user & comment', async () => {
    const user = testData.users[0];
    const comment = testData.comments[10];
    const emote = testData.emotes[0];
    await emoteDB.insertForComment.run(
      {
        id: emote.emote_id,
        userID: user.user_uid,
        commentID: comment.comment_uid,
      },
      client,
    );
    const newEmoteQuery = await client.query(
      'SELECT * FROM comment_emotes WHERE user_id = $1 AND comment_id = $2 AND emote_id = $3;',
      [user.user_id, comment.comment_id, emote.emote_id],
    );
    expect(newEmoteQuery.rowCount).toBeGreaterThan(0);
  });
});

describe('updatePostEmote', () => {
  it('Updates the emote ID of the specific post emote', async () => {
    const emote = testData.post_emotes[0];
    const user = testData.users.find((u) => emote.user_id === u.user_id);
    const post = testData.posts.find((p) => emote.post_id === p.post_id);
    const newEmoteID = emote.emote_id === 2 ? 3 : 2;
    await emoteDB.updatePostEmote.run(
      {
        userID: user?.user_uid,
        postID: post?.post_uid,
        id: newEmoteID,
      },
      client,
    );
    const updatedEmoteQuery = await client.query(
      'SELECT * FROM post_emotes WHERE user_id = $1 AND post_id = $2 AND emote_id = $3;',
      [user?.user_id, post?.post_id, newEmoteID],
    );
    expect(updatedEmoteQuery.rowCount).toBeGreaterThan(0);
  });
});

describe('updateCommentEmote', () => {
  it('Updates the emote ID of the specific comment emote', async () => {
    const emote = testData.comment_emotes[0];
    const user = testData.users.find((u) => emote.user_id === u.user_id);
    const comment = testData.comments.find(
      (c) => emote.comment_id === c.comment_id,
    );
    const newEmoteID = emote.emote_id === 2 ? 3 : 2;
    await emoteDB.updateCommentEmote.run(
      {
        userID: user?.user_uid,
        commentID: comment?.comment_uid,
        id: newEmoteID,
      },
      client,
    );
    const updatedEmoteQuery = await client.query(
      'SELECT * FROM comment_emotes WHERE user_id = $1 AND comment_id = $2 AND emote_id = $3;',
      [user?.user_id, comment?.comment_id, newEmoteID],
    );
    expect(updatedEmoteQuery.rowCount).toBeGreaterThan(0);
  });
});

describe('removeFromPost', () => {
  it('Deletes a users specific post emote', async () => {
    const emote = testData.post_emotes[0];
    const user = testData.users.find((u) => emote.user_id === u.user_id);
    const post = testData.posts.find((p) => emote.post_id === p.post_id);
    await emoteDB.removeFromPost.run(
      {
        userID: user?.user_uid,
        postID: post?.post_uid,
      },
      client,
    );
    const updatedEmoteQuery = await client.query(
      'SELECT * FROM post_emotes WHERE user_id = $1 AND post_id = $2;',
      [user?.user_id, post?.post_id],
    );
    expect(updatedEmoteQuery.rowCount).toBe(0);
  });
});

describe('removeFromComment', () => {
  it('Deletes a users specific comment emote', async () => {
    const emote = testData.comment_emotes[0];
    const user = testData.users.find((u) => emote.user_id === u.user_id);
    const comment = testData.comments.find(
      (c) => emote.comment_id === c.comment_id,
    );
    await emoteDB.removeFromComment.run(
      {
        userID: user?.user_uid,
        commentID: comment?.comment_uid,
      },
      client,
    );
    const updatedEmoteQuery = await client.query(
      'SELECT * FROM comment_emotes WHERE user_id = $1 AND comment_id = $2;',
      [user?.user_id, comment?.comment_id],
    );
    expect(updatedEmoteQuery.rowCount).toBe(0);
  });
});
