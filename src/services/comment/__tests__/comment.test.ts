import { describe, it, expect, vi } from 'vitest';
import { comments as commentDB } from '@/db';
import { IInsertParams } from '@/db/queries/comments/comments.queries';
import * as nanoid from 'nanoid';
import { comment } from '..';
import { SortAndPaginationOpts } from '../comment';

vi.mock('nanoid');

describe('getCommentTree()', () => {
  it('Gets the comment tree and maps its IDs to comment data', async () => {
    const commentTree = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const treeSpy = vi
      .spyOn(commentDB.tree, 'run')
      .mockResolvedValue(commentTree as any);

    const output: any = [];
    const findSpy = vi.spyOn(commentDB.find, 'run').mockResolvedValue(output);

    const rootCommentID = 'testID';

    const comments = await comment.getCommentTree(rootCommentID);
    expect(treeSpy.mock.calls[0][0]).toMatchObject({ rootCommentID });
    expect(findSpy.mock.calls[0][0]).toMatchObject({
      ids: expect.arrayContaining(commentTree.map(({ id }) => id)),
    });
    expect(comments).toBe(output);
  });
});

describe('findBySlug', () => {
  it('Passes the username, slug, and pagination options to the DB handler and returns the output', async () => {
    const output: any = [];
    const username = 'username';
    const slug = 'slug';
    const options: SortAndPaginationOpts = {
      limit: 4,
      nextID: 'test',
      popular: true,
    };
    const findSpy = vi.spyOn(commentDB.find, 'run').mockResolvedValue(output);
    const comments = await comment.findBySlug(username, slug, options);

    expect(findSpy.mock.calls[0][0]).toMatchObject({
      username,
      slug,
      ...options,
    });
    expect(comments).toBe(output);
  });
});

describe('findByRelation', () => {
  it('Passes the post ID and pagination options to the DB handler and returns the output', async () => {
    const output: any = [];
    const postID = 'postID';
    const userID = 'userID';
    const options: SortAndPaginationOpts = {
      limit: 4,
      nextID: 'test',
      popular: true,
    };
    const findSpy = vi.spyOn(commentDB.find, 'run').mockResolvedValue(output);
    const comments = await comment.findByRelation({ postID, userID }, options);

    expect(findSpy.mock.calls[0][0]).toMatchObject({
      postID,
      userID,
      ...options,
    });
    expect(comments).toBe(output);
  });
});

describe('getByIDs', () => {
  it('Passes the ID array and pagination options to the DB handler and returns the output', async () => {
    const output: any = [];
    const ids = ['a', 'b', 'c'];
    const options: SortAndPaginationOpts = {
      limit: 4,
      nextID: 'test',
      popular: true,
    };
    const findSpy = vi.spyOn(commentDB.find, 'run').mockResolvedValue(output);
    const comments = await comment.getByIDs(ids, options);

    expect(findSpy.mock.calls[0][0]).toMatchObject({
      ids,
      ...options,
    });
    expect(comments).toBe(output);
  });
});

describe('create()', () => {
  it('Passes the comment data to the DB handler', async () => {
    const newComment: IInsertParams = {
      body: 'test',
      id: 'testID',
      postID: 'postID',
      userID: 'userID',
      parentID: 'parentComment',
    };
    const insertSpy = vi
      .spyOn(commentDB.insert, 'run')
      .mockImplementation(async () => []);
    await comment.create(newComment);
    expect(insertSpy.mock.calls[0][0]).toMatchObject(newComment);
  });
});

describe('edit()', () => {
  it('Passes the comment ID and new body to the DB handler', async () => {
    const id = 'testID';
    const newBody = 'testing testing';
    const updateSpy = vi
      .spyOn(commentDB.update, 'run')
      .mockImplementation(async () => []);

    await comment.edit(id, newBody);
    expect(updateSpy.mock.calls[0][0]).toMatchObject({ id, body: newBody });
  });
});

describe('remove()', () => {
  it('Passes the comment ID to the DB handler', async () => {
    const id = 'testID';
    const removeSpy = vi
      .spyOn(commentDB.remove, 'run')
      .mockImplementation(async () => []);

    await comment.remove(id);
    expect(removeSpy.mock.calls[0][0]).toMatchObject({ ids: [id] });
  });
});

describe('generateID()', () => {
  it('Generates a comment ID thats not in the DB', async () => {
    const takenID = 'taken';
    const availableID = 'good-to-go';
    vi.spyOn(nanoid, 'nanoid').mockReturnValueOnce(takenID);
    vi.spyOn(commentDB.find, 'run').mockResolvedValueOnce([{} as any]);

    vi.spyOn(nanoid, 'nanoid').mockReturnValueOnce(availableID);
    vi.spyOn(commentDB.find, 'run').mockResolvedValueOnce([]);

    const id = await comment.generateID();
    expect(id).toBe(availableID);
  });
});
