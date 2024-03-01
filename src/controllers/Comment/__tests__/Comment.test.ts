import {
  comment as commentService,
  user as userService,
  post as postService,
} from '@/services';
import { describe, expect, test, vi } from 'vitest';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { errorIDs } from '@blogfolio/types';
import { SortAndPaginationOpts } from '@/services/comment/comment';
import { Comment as CommentController } from '..';

const Comment = CommentController.__baseHandlers;

const testComment = {
  id: 'testID',
  parentID: 'parentID',
  body: 'body',
  userID: 'userID',
  postID: 'postID',
};

describe('Get', () => {
  test('Comment doesnt exist: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([]);
    const id = 'testID';
    const response = await Comment.Get({ params: { id } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id },
      });
    }
  });

  test('Comment exists: HTTP Success Ok. Respond with comment', async () => {
    const comment = { ...testComment };
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([comment as any]);
    const response = await Comment.Get({ params: { id: 'testID' } });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.comment).toBe(comment);
    }
  });
});

describe('GetByRelation', () => {
  test('User ID passsed but doesnt exist: HTTP Error Not found. Respond with id', async () => {
    vi.spyOn(userService, 'findMissing').mockResolvedValue([{ id: 'test' }]);
    const userID = 'testID';
    const response = await Comment.GetByRelation({ query: { userID } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.User.UserNotFound,
        data: { id: userID },
      });
    }
  });
  test('Post ID passed but doesnt exist: HTTP Error Not Found. Respond with id', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const postID = 'testID';
    const response = await Comment.GetByRelation({ query: { postID } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id: postID },
      });
    }
  });
  test('IDs exist: HTTP Success Ok. Respond with comments. Passes options.', async () => {
    vi.spyOn(userService, 'findMissing').mockResolvedValue([]);
    vi.spyOn(postService, 'get').mockResolvedValue({} as any);
    const comments: any[] = [];
    const findSpy = vi
      .spyOn(commentService, 'findByRelation')
      .mockResolvedValue(comments);
    const options: SortAndPaginationOpts = {
      limit: 30,
      nextID: 'testNext',
      popular: true,
    };
    const response = await Comment.GetByRelation({
      query: {
        userID: 'testID',
        postID: 'testPost',
        ...options,
      },
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.comments).toBe(comments);
    }
    expect(findSpy.mock.calls[0][1]).toMatchObject(options);
  });
});

describe('GetBySlug', () => {
  test('Username & Slug exists: HTTP Success Ok. Respond with comments. Passes options.', async () => {
    const slug = 'testSlug';
    const username = 'testUsername';
    const comments: any[] = [];
    const findSpy = vi
      .spyOn(commentService, 'findBySlug')
      .mockResolvedValue(comments);
    const options: SortAndPaginationOpts = {
      limit: 30,
      nextID: 'testNext',
      popular: true,
    };
    const response = await Comment.GetBySlug({
      params: { slug, username },
      query: options,
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.comments).toBe(comments);
    }
    expect(findSpy).toHaveBeenCalledWith(username, slug, options);
  });
});

describe('Post', () => {
  test('Post ID doesnt exist. HTTP Error Not found. Response with ID', async () => {
    const postID = 'postID';
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const response = await Comment.Post(
      { body: { body: 'body', postID } },
      { res: { locals: { userID: 'userID' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id: postID },
      });
    }
  });

  test('Post Found. HTTP Success Created. Create comment. Respond with ID', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue({} as any);
    const id = 'commentID';
    vi.spyOn(commentService, 'generateID').mockResolvedValue(id);
    const body = 'body';
    const parentID = 'parentID';
    const userID = 'userID';
    const postID = 'postID';
    const serviceCreateSpy = vi
      .spyOn(commentService, 'create')
      .mockImplementation(async () => []);
    const response = await Comment.Post(
      { body: { parentID, body, postID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Created);
    if (response.status === SuccessCode.Created) {
      expect(response.body.data.id).toBe(id);
    }
    expect(serviceCreateSpy).toHaveBeenCalledWith({
      body,
      id,
      parentID,
      postID,
      userID,
    });
  });
});

describe('Put', () => {
  test('Comment not found: HTTP Error Not found. Respond with ID.', async () => {
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([]);
    const id = 'testID';
    const response = await Comment.Put(
      { params: { id }, body: { body: 'test' } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id },
      });
    }
  });

  test('User isnt the author: HTTP Error Unauthorized.', async () => {
    const userID = 'author';
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([{ userID } as any]);
    const loggedInID = 'Rando';
    const response = await Comment.Put(
      { params: { id: 'test' }, body: { body: 'test' } },
      { res: { locals: { userID: loggedInID } } },
    );
    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Comment exists & author is logged in. HTTP Success Ok. Update comment.', async () => {
    const userID = 'author';
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([{ userID } as any]);
    const body = 'new body';
    const id = 'testID';
    const updateSpy = vi
      .spyOn(commentService, 'edit')
      .mockImplementation(async () => []);
    const response = await Comment.Put(
      { params: { id }, body: { body } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(updateSpy).toHaveBeenCalledWith(id, body);
  });
});

describe('Delete', () => {
  test('Comment not found: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([]);
    const id = 'testID';
    const response = await Comment.Delete(
      { params: { id } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id },
      });
    }
  });

  test('User isnt the author: HTTP Error Unauthorized.', async () => {
    const userID = 'author';
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([{ userID } as any]);
    const loggedInID = 'Rando';
    const response = await Comment.Delete(
      { params: { id: 'test' } },
      { res: { locals: { userID: loggedInID } } },
    );
    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Comment exists & author is logged in. HTTP Success Ok. Update comment.', async () => {
    const userID = 'author';
    vi.spyOn(commentService, 'getByIDs').mockResolvedValue([{ userID } as any]);
    const id = 'testID';
    const deleteSpy = vi
      .spyOn(commentService, 'remove')
      .mockImplementation(async () => []);
    const response = await Comment.Delete(
      { params: { id } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(deleteSpy).toHaveBeenCalledWith(id);
  });
});
