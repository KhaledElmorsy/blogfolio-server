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
import * as postsDB from '../posts.queries';

beforeAll(async () => {
  await pool.query(
    generateDBInserts(testData, ['users', 'posts'], {
      posts: { post_id: true },
    }),
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

function filterMapSort<T, F extends keyof T>({
  data,
  filterBy: filterColumn,
  filterValue,
  map,
}: {
  data: T[];
  filterBy: F;
  filterValue: T[F];
  map: keyof T;
}) {
  const filteredData = data.filter((row) => row[filterColumn] === filterValue);
  const mappedData = filteredData.map((row) => row[map]);
  return mappedData.sort();
}

describe('find()', () => {
  it('Finds posts based on a passed user ID', async () => {
    const { user_uid: userID, user_id: userPK } = testData.users[0];
    const expectedPostIDs = filterMapSort({
      data: testData.posts,
      filterBy: 'user_id',
      filterValue: userPK,
      map: 'post_uid',
    });
    const queriedPosts = await postsDB.find.run({ userID }, client);
    const queriedPostIDs = queriedPosts.map(({ id }) => id).sort();
    expect(expectedPostIDs).toEqual(queriedPostIDs);
  });

  it('Finds posts based on a passed username', async () => {
    const { username, user_id: userPK } = testData.users[0];
    const expectedPostIDs = filterMapSort({
      data: testData.posts,
      filterBy: 'user_id',
      filterValue: userPK,
      map: 'post_uid',
    });
    const queriedPosts = await postsDB.find.run({ username }, client);
    const queriedPostIDs = queriedPosts.map(({ id }) => id).sort();
    expect(expectedPostIDs).toEqual(queriedPostIDs);
  });

  it('Gets post by slug', async () => {
    const testPost = testData.posts[2];
    const { slug, post_uid: actualID } = testPost;
    const [queriedPost] = await postsDB.find.run({ slug }, client);
    expect(queriedPost.id).toBe(actualID);
  });

  it('Gets post by uid', async () => {
    const testPost = testData.posts[2];
    const { slug: expectedSlug, post_uid: id } = testPost;
    const [queriedPost] = await postsDB.find.run({ id }, client);
    expect(queriedPost.slug).toBe(expectedSlug);
  });

  it('Filters posts by visibility', async () => {
    const invisiblePostIDs = filterMapSort({
      data: testData.posts,
      filterBy: 'visible',
      filterValue: false,
      map: 'post_uid',
    });
    const queriedPost = await postsDB.find.run({ visible: false }, client);
    const actualIDs = queriedPost.map(({ id }) => id).sort();
    expect(actualIDs).toEqual(invisiblePostIDs);
  });

  it('Searches through post titles, summaries, bodies', async () => {
    const searchTerm = testData.posts[0].title.slice(0, 3);
    const expectedPostIDs = testData.posts
      .filter(({ title, summary, body }) =>
        `${title} ${summary} ${body}`.includes(searchTerm),
      )
      .map(({ post_uid }) => post_uid)
      .sort();

    const queriedPosts = await postsDB.find.run({ search: searchTerm }, client);
    const queriedIDs = queriedPosts.map(({ id }) => id).sort();
    expect(queriedIDs).toEqual(expectedPostIDs);
  });

  it('Paginates results', async () => {
    const limit = 3;
    const visiblePosts = testData.posts
      .filter(({ visible }) => visible)
      .sort((a, b) => b.num_views - a.num_views)
      .map(({ post_uid }) => post_uid);
    const firstPageIDs = visiblePosts.slice(0, limit);
    const secondPageIDs = visiblePosts.slice(limit, 2 * limit);
    const nextID = firstPageIDs.at(-1);
    const queriedFirstPage = await postsDB.find.run(
      { visible: true, limit },
      client,
    );
    const queriedSecondPage = await postsDB.find.run(
      {
        visible: true,
        limit,
        nextID,
      },
      client,
    );
    const queriedFirstIDs = queriedFirstPage.map(({ id }) => id);
    const queriedSecondIDs = queriedSecondPage.map(({ id }) => id);
    expect(queriedFirstIDs).toEqual(firstPageIDs);
    expect(queriedSecondIDs).toEqual(secondPageIDs);
  });

  it('Can optionally sort by most recent and paginates the results', async () => {
    const limit = 3;
    const visiblePosts = testData.posts
      .filter(({ visible }) => visible)
      .sort(
        (a, b) =>
          new Date(b.edited_at ?? b.created_at).valueOf()
          - new Date(a.edited_at ?? a.created_at).valueOf(),
      )
      .map(({ post_uid }) => post_uid);
    const firstPageIDs = visiblePosts.slice(0, limit);
    const secondPageIDs = visiblePosts.slice(limit, 2 * limit);
    const nextID = firstPageIDs.at(-1);
    const queriedFirstPage = await postsDB.find.run(
      { visible: true, limit, recentFirst: true },
      client,
    );
    const queriedSecondPage = await postsDB.find.run(
      {
        visible: true,
        limit,
        nextID,
        recentFirst: true,
      },
      client,
    );
    const queriedFirstIDs = queriedFirstPage.map(({ id }) => id);
    const queriedSecondIDs = queriedSecondPage.map(({ id }) => id);
    expect(queriedFirstIDs).toEqual(firstPageIDs);
    expect(queriedSecondIDs).toEqual(secondPageIDs);
  });
});

describe('addView()', () => {
  it('Increments the view count of the post with the passed UID', async () => {
    const { post_uid: testPostUID, num_views: testViews } = testData.posts[0];
    await postsDB.addView.run({ id: testPostUID }, client);
    const [{ num_views: newViews }] = (
      await client.query('SELECT num_views FROM posts WHERE post_uid = $1', [
        testPostUID,
      ])
    ).rows as any;
    expect(newViews).toBe(testViews + 1);
  });
});

describe('insert()', () => {
  it('Inserts a post with the passed details', async () => {
    const testAuthor = testData.users[0];
    const newPostBase: Omit<postsDB.IInsertParams, 'userID'> = {
      body: 'body',
      title: 'title',
      postID: 'testpostID',
      slug: 'test-post',
      summary: 'summary',
    };
    await postsDB.insert.run(
      { ...newPostBase, userID: testAuthor.user_uid },
      client,
    );
    const newPost = (
      await client.query(
        `SELECT 
          body,
          title,
          summary,
          slug,
          post_uid as "postID",
          user_id as userpk
        FROM posts p WHERE post_uid = $1;`,
        [newPostBase.postID],
      )
    ).rows[0];
    expect(newPost).toMatchObject({
      userpk: testAuthor.user_id,
      ...newPostBase,
    });
  });
});

describe('update()', () => {
  it('Updates the details of a post with the passed ID', async () => {
    const postID = testData.posts[0].post_uid;
    const newData: Omit<postsDB.IUpdateParams, 'id'> = {
      body: 'newBody',
      slug: 'new-slug',
      summary: 'fresh out of the oven',
      title: 'new post',
      visible: true,
    };
    await postsDB.update.run({ ...newData, id: postID }, client);
    const updatedPost = (
      await client.query(
        `SELECT 
        body, 
        summary, 
        title, 
        visible,
        slug
      FROM posts
      WHERE post_uid = $1;`,
        [postID],
      )
    ).rows[0];
    expect(updatedPost).toMatchObject(newData);
  });
});

describe('remove()', () => {
  it('Deletes posts with the passed IDs', async () => {
    const IDsToDelete = testData.posts
      .slice(0, 4)
      .map(({ post_uid }) => post_uid);
    await postsDB.remove.run({ ids: IDsToDelete }, client);
    const dbPosts = await client.query(
      'SELECT * FROM posts WHERE post_uid = ANY ($1)',
      [IDsToDelete],
    );
    expect(dbPosts.rowCount).toBe(0);
  });
});

describe('checkIDs', () => {
  it('Gets all existing IDs in the passed array', async () => {
    const existingPosts = testData.posts.slice(0, 10);
    const existingPostIDs = existingPosts.map(({ post_uid }) => post_uid);
    const fakeIDs = ['not-real', 'not-real2', 'who-is-this'];
    const queryPosts = await postsDB.checkIDs.run(
      {
        postIDs: existingPostIDs.concat(fakeIDs),
      },
      client,
    );
    const queryIDs = queryPosts.map(({ id }) => id);
    expect(queryIDs.sort()).toEqual(existingPostIDs.sort());
  });
});
