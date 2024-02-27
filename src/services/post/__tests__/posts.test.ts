import { posts as postDB } from '@/db';
import { it, describe, expect, vi } from 'vitest';
import { IInsertParams } from '@/db/queries/posts/posts.queries';
import * as nanoidModule from 'nanoid';
import * as posts from '../post';
import { post } from '..';

vi.mock('nanoid', () => ({
  nanoid: vi.fn(),
}));

/** Simple function to use as mock implementation w/ a short name */
function m(output?: any) {
  return async () => output;
}

describe('get()', () => {
  it('Calls db with the post ID and returns output', async () => {
    const id = 'test';
    const expectedOutput = [{}];
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.get(id);

    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({ id });
    expect(output).toBe(expectedOutput[0]);
  });
});

describe('getBySlug()', () => {
  it('Calls db with the post slug and username and returns the output', async () => {
    const username = 'test';
    const slug = 'post-slug';
    const expectedOutput = [{}];
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getBySlug(slug, username);

    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({ slug, username });
    expect(output).toBe(expectedOutput[0]);
  });
});

describe('getByUsername()', () => {
  it('Gets visible posts by the username', async () => {
    const username = 'test';
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getByUsername(username);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      username,
      visible: true,
    });
    expect(output).toBe(expectedOutput);
  });

  it('Optionally passes sort, search and pagination options', async () => {
    const username = 'test';
    const searchData = {
      searchTerm: 'react',
      limit: 10,
      nextID: 'testID',
      sortByDate: false,
    };
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getByUsername(username, searchData);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      username,
      visible: true,
      limit: searchData.limit,
      search: searchData.searchTerm,
      nextID: searchData.nextID,
      recentFirst: searchData.sortByDate,
    });
    expect(output).toBe(expectedOutput);
  });
});

describe('getByUserID()', () => {
  it('Gets visible (by default) posts by the user', async () => {
    const userID = 'testid';
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getByUserID(userID);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({ userID });
    expect(output).toBe(expectedOutput);
  });

  it('Can get hidden posts', async () => {
    const userID = 'testid';
    const visible = false;
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getByUserID(userID, { visible });
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      userID,
      visible,
    });
    expect(output).toBe(expectedOutput);
  });

  it('Optionally passes sort, search and pagination options', async () => {
    const userID = 'testid';
    const searchData = {
      searchTerm: 'react',
      limit: 10,
      nextID: 'testID',
      sortByDate: false,
    };
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.getByUserID(userID, searchData);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      userID,
      limit: searchData.limit,
      search: searchData.searchTerm,
      nextID: searchData.nextID,
      recentFirst: searchData.sortByDate,
    });
    expect(output).toBe(expectedOutput);
  });
});

describe('search()', () => {
  it('Searches DB for visible matching posts', async () => {
    const query = 'the';
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.search(query);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      search: query,
      visible: true,
    });
    expect(output).toBe(expectedOutput);
  });

  it('Passes sorting & pagination options if passed', async () => {
    const query = 'the';
    const nextID = 'lastPost';
    const limit = 20;
    const sortByDate = false;
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.search(query, { limit, nextID, sortByDate });
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      search: query,
      visible: true,
      limit,
      nextID,
      recentFirst: sortByDate,
    });
    expect(output).toBe(expectedOutput);
  });
});

describe('searchUserPosts()', () => {
  it('Searches DB for visible matching posts by the passed user', async () => {
    const query = 'the';
    const userID = 'testID';
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.searchUserPosts(query, userID);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      userID,
      search: query,
      visible: true,
    });
    expect(output).toBe(expectedOutput);
  });

  it('Optionally passes sort & pagination options if passed', async () => {
    const query = 'the';
    const nextID = 'lastPost';
    const userID = 'testID';
    const sortByDate = false;
    const limit = 20;
    const expectedOutput = {};
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockImplementation(m(expectedOutput));

    const output = await posts.searchUserPosts(query, userID, {
      limit,
      nextID,
      sortByDate,
    });
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({
      search: query,
      userID,
      visible: true,
      limit,
      nextID,
      recentFirst: sortByDate,
    });
    expect(output).toBe(expectedOutput);
  });
});

describe('addView()', () => {
  it('Calls DB query with the post ID', async () => {
    const id = 'testID';
    const dbAddViewSpy = vi
      .spyOn(postDB.addView, 'run')
      .mockImplementation(m());

    await posts.addView(id);
    expect(dbAddViewSpy).toHaveBeenCalledOnce();
    expect(dbAddViewSpy.mock.calls[0][0]).toMatchObject({ id });
  });
});

describe('create()', () => {
  it('Passes post details to the DB query', async () => {
    const postDetails: IInsertParams = {
      body: 'body',
      postID: 'id',
      title: 'title',
      userID: 'user',
      slug: 'slug',
      summary: 'hmm',
    };
    const dbInsertSpy = vi.spyOn(postDB.insert, 'run').mockImplementation(m());

    await posts.create(postDetails);
    expect(dbInsertSpy).toHaveBeenCalledOnce();
    expect(dbInsertSpy.mock.calls[0][0]).toMatchObject(postDetails);
  });
});

describe('remove()', () => {
  it('Passes post ID to db handler', async () => {
    const id = 'testID';
    const dbRemoveSpy = vi.spyOn(postDB.remove, 'run').mockImplementation(m());

    await posts.remove(id);

    expect(dbRemoveSpy).toHaveBeenCalledOnce();
    expect(dbRemoveSpy.mock.calls[0][0]).toMatchObject({ ids: [id] });
  });
});

describe('generateID()', () => {
  it('Returns a unique ID thats not in the DB', async () => {
    const takenID = 'taken';
    const availableID = 'fresh';
    vi.spyOn(nanoidModule, 'nanoid')
      .mockReturnValueOnce(takenID)
      .mockReturnValueOnce(availableID);

    vi.spyOn(postDB.find, 'run').mockImplementation(async ({ id }) =>
      (id === takenID ? [{}] : ([] as any)),
    );

    const newID = await posts.generateID();

    expect(newID).toBe(availableID);
  });
});

describe('checkSlug()', () => {
  it('Checks DB and returns whether a slug is available for the user', async () => {
    const userID = 'testID';
    const slug = 'slug';
    const dbFindSpy = vi
      .spyOn(postDB.find, 'run')
      .mockResolvedValue([{} as any]);

    const slugAvailable = await post.checkSlug(userID, slug);

    expect(slugAvailable).toBe(false);
    expect(dbFindSpy).toHaveBeenCalledOnce();
    expect(dbFindSpy.mock.calls[0][0]).toMatchObject({ userID, slug });
  });
});
