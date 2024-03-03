import { describe, vi, test, expect } from 'vitest';
import {
  emote as emoteService,
  post as postService,
  comment as commentService,
  user as userService,
} from '@/services';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { errorIDs } from '@blogfolio/types';
import EmoteController from '../Emote';

const Emote = EmoteController.__baseHandlers;

describe('Get', () => {
  test('Server is up and running: HTTP Success Ok. Responds with emote list', async () => {
    const emotes = [{ id: 1, body: '😊' }];
    vi.spyOn(emoteService, 'getEmotes').mockResolvedValue(emotes);
    const response = await Emote.Get({});
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data).toBe(emotes);
    }
  });
});

describe('PostGetPostEmotes', () => {
  test('IDs dont exist: HTTP Error Not Found. Respond with missing IDs', async () => {
    const missingIDs = ['fake', 'phoney'];
    const realIDs = ['real', 'genuine'];
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue(missingIDs);
    const response = await Emote.PostGetPostEmotes({
      body: { ids: missingIDs.concat(realIDs) },
    });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { ids: missingIDs },
      });
    }
  });

  test('All posts exist: HTTP Success Ok. Respond with emotes', async () => {
    const emotes = [{ postID: 'a', userID: 'b', id: 1 }];
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getPostEmotes').mockResolvedValue(emotes);
    const response = await Emote.PostGetPostEmotes({ body: { ids: ['test'] } });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data).toEqual(
        emotes.map(({ postID, userID, id }) => ({
          postID,
          userID,
          emoteID: id,
        })),
      );
    }
  });
  describe('With optional user ID', () => {
    test('User ID doesnt exist: HTTP Error Not found. Respond with ID', async () => {
      const userID = 'testID';
      vi.spyOn(userService, 'findMissing').mockResolvedValue([{ id: userID }]);
      const response = await Emote.PostGetPostEmotes({
        body: { ids: ['test'], userID },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: userID },
        });
      }
    });
    test('User exists: HTTP Success Ok. Pass user ID into emote finder', async () => {
      vi.spyOn(userService, 'findMissing').mockResolvedValue([]);
      vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
      const emotes = [{ id: 1, userID: 'test', postID: 'test' }];
      const emoteFinderSpy = vi
        .spyOn(emoteService, 'getPostEmotes')
        .mockResolvedValue(emotes);
      const postIDs = ['a', 'b'];
      const userID = 'userID';
      const response = await Emote.PostGetPostEmotes({
        body: { ids: postIDs, userID },
      });
      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body.data).toEqual(
          emotes.map((emote) => ({
            emoteID: emote.id,
            userID: emote.userID,
            postID: emote.postID,
          })),
        );
      }
      expect(emoteFinderSpy).toHaveBeenCalledWith(postIDs, userID);
    });
  });
});

describe('PostGetCommentEmotes', () => {
  test('IDs dont exist: HTTP Error Not Found. Respond with missing IDs', async () => {
    const missingIDs = ['fake', 'phoney'];
    const realIDs = ['real', 'genuine'];
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue(missingIDs);
    const response = await Emote.PostGetCommentEmotes({
      body: { ids: missingIDs.concat(realIDs) },
    });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { ids: missingIDs },
      });
    }
  });

  test('All comments exist: HTTP Success Ok. Respond with emotes', async () => {
    const emotes = [{ commentID: 'a', userID: 'b', id: 1 }];
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getCommentEmotes').mockResolvedValue(emotes);
    const response = await Emote.PostGetCommentEmotes({
      body: { ids: ['test'] },
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data).toEqual(
        emotes.map(({ commentID, userID, id }) => ({
          commentID,
          userID,
          emoteID: id,
        })),
      );
    }
  });
  describe('With optional user ID', () => {
    test('User ID doesnt exist: HTTP Error Not found. Respond with ID', async () => {
      const userID = 'testID';
      vi.spyOn(userService, 'findMissing').mockResolvedValue([{ id: userID }]);
      const response = await Emote.PostGetCommentEmotes({
        body: { ids: ['test'], userID },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: userID },
        });
      }
    });
    test('User exists: HTTP Success Ok. Pass user ID into emote finder', async () => {
      vi.spyOn(userService, 'findMissing').mockResolvedValue([]);
      vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
      const emotes = [{ id: 1, userID: 'test', commentID: 'test' }];
      const emoteFinderSpy = vi
        .spyOn(emoteService, 'getCommentEmotes')
        .mockResolvedValue(emotes);
      const commentIDs = ['a', 'b'];
      const userID = 'userID';
      const response = await Emote.PostGetCommentEmotes({
        body: { ids: commentIDs, userID },
      });
      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body.data).toEqual(
          emotes.map((emote) => ({
            emoteID: emote.id,
            userID: emote.userID,
            commentID: emote.commentID,
          })),
        );
      }
      expect(emoteFinderSpy).toHaveBeenCalledWith(commentIDs, userID);
    });
  });
});

describe('PostNewPostEmote', () => {
  test('Emote ID doesnt exist: HTTP Error Not found. Respond with emote ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(false);
    const emoteID = 1;
    const response = await Emote.PostNewPostEmote(
      {
        body: { emoteID, postID: 'testPost' },
      },
      { res: { locals: { userID: 'testUser' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NotFound,
        data: { id: emoteID },
      });
    }
  });

  test('Post doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const postID = 'testID';
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([postID]);
    const response = await Emote.PostNewPostEmote(
      { body: { emoteID: 2, postID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id: postID },
      });
    }
  });

  test('All exist: HTTP Success Created. Update data.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    const postID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    const emoteCreateSpy = vi
      .spyOn(emoteService, 'addToPost')
      .mockImplementation(async () => []);
    const response = await Emote.PostNewPostEmote(
      { body: { postID, emoteID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Created);
    expect(emoteCreateSpy).toHaveBeenCalledWith({ emoteID, postID, userID });
  });
});

describe('PostNewCommentEmote', () => {
  test('Emote ID doesnt exist: HTTP Error Not found. Respond with emote ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(false);
    const emoteID = 1;
    const response = await Emote.PostNewCommentEmote(
      {
        body: { emoteID, commentID: 'testPost' },
      },
      { res: { locals: { userID: 'testUser' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NotFound,
        data: { id: emoteID },
      });
    }
  });

  test('Comment doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const commentID = 'testID';
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([commentID]);
    const response = await Emote.PostNewCommentEmote(
      { body: { emoteID: 2, commentID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id: commentID },
      });
    }
  });

  test('All exist: HTTP Success Created. Update data.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    const commentID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    const emoteCreateSpy = vi
      .spyOn(emoteService, 'addToComment')
      .mockImplementation(async () => []);
    const response = await Emote.PostNewCommentEmote(
      { body: { commentID, emoteID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Created);
    expect(emoteCreateSpy).toHaveBeenCalledWith({ emoteID, commentID, userID });
  });
});

describe('PutPostEmote', () => {
  test('Emote ID doesnt exist: HTTP Error Not found. Respond with emote ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(false);
    const emoteID = 1;
    const response = await Emote.PutPostEmote(
      {
        body: { emoteID, postID: 'testPost' },
      },
      { res: { locals: { userID: 'testUser' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NotFound,
        data: { id: emoteID },
      });
    }
  });

  test('Post doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const postID = 'testID';
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([postID]);
    const response = await Emote.PutPostEmote(
      { body: { emoteID: 2, postID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id: postID },
      });
    }
  });

  test('User emote doesnt exist: HTTP Not found. Respond with post & user IDs', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getPostEmotes').mockResolvedValue([]);
    const postID = 'postID';
    const userID = 'userID';
    const response = await Emote.PutPostEmote(
      { body: { postID, emoteID: 2 } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NoEmotePost,
        data: { userID, postID },
      });
    }
  });

  test('All exist: HTTP Success Ok. Update data.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getPostEmotes').mockResolvedValue([{} as any]);
    const postID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    const emoteUpdateSpy = vi
      .spyOn(emoteService, 'updatePostEmote')
      .mockImplementation(async () => []);
    const response = await Emote.PutPostEmote(
      { body: { postID, emoteID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(emoteUpdateSpy).toHaveBeenCalledWith({ emoteID, postID, userID });
  });
});

describe('PutCommentEmote', () => {
  test('Emote ID doesnt exist: HTTP Error Not found. Respond with emote ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(false);
    const emoteID = 1;
    const response = await Emote.PutCommentEmote(
      {
        body: { emoteID, commentID: 'testPost' },
      },
      { res: { locals: { userID: 'testUser' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NotFound,
        data: { id: emoteID },
      });
    }
  });

  test('Comment doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const commentID = 'testID';
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([commentID]);
    const response = await Emote.PutCommentEmote(
      { body: { emoteID: 2, commentID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id: commentID },
      });
    }
  });

  test('User emote doesnt exist: HTTP Not found. Respond with comment & user IDs', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getCommentEmotes').mockResolvedValue([]);
    const commentID = 'commentID';
    const userID = 'userID';
    const response = await Emote.PutCommentEmote(
      { body: { commentID, emoteID: 2 } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NoEmoteComment,
        data: { userID, commentID },
      });
    }
  });

  test('All exist: HTTP Success Ok. Update data.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getCommentEmotes').mockResolvedValue([{} as any]);
    const commentID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    const emoteUpdateSpy = vi
      .spyOn(emoteService, 'updateCommentEmote')
      .mockImplementation(async () => []);
    const response = await Emote.PutCommentEmote(
      { body: { commentID, emoteID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(emoteUpdateSpy).toHaveBeenCalledWith({ emoteID, commentID, userID });
  });
});

describe('DeletePostEmote', () => {
  test('Post doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const postID = 'testID';
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([postID]);
    const response = await Emote.DeletePostEmote(
      { params: { postID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id: postID },
      });
    }
  });

  test('User emote doesnt exist: HTTP Not found. Respond with post & user IDs', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getPostEmotes').mockResolvedValue([]);
    const postID = 'postID';
    const userID = 'userID';
    const response = await Emote.DeletePostEmote(
      { params: { postID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NoEmotePost,
        data: { userID, postID },
      });
    }
  });

  test('All exist: HTTP Success Ok. Remove emote.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(postService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getPostEmotes').mockResolvedValue([{} as any]);
    const postID = 'testID';
    const userID = 'userID';
    const emoteRemoveSpy = vi
      .spyOn(emoteService, 'removeFromPost')
      .mockImplementation(async () => []);
    const response = await Emote.DeletePostEmote(
      { params: { postID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(emoteRemoveSpy).toHaveBeenCalledWith({ postID, userID });
  });
});

describe('DeleteCommentEmote', () => {
  test('Comment doesnt exist: HTTP Error Not found. Respond with post ID', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    const commentID = 'testID';
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([commentID]);
    const response = await Emote.DeleteCommentEmote(
      { params: { commentID } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Comment.NotFound,
        data: { id: commentID },
      });
    }
  });

  test('User emote doesnt exist: HTTP Not found. Respond with comment & user IDs', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getCommentEmotes').mockResolvedValue([]);
    const commentID = 'commentID';
    const userID = 'userID';
    const response = await Emote.DeleteCommentEmote(
      { params: { commentID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Emote.NoEmoteComment,
        data: { userID, commentID },
      });
    }
  });

  test('All exist: HTTP Success Ok. Remove emote.', async () => {
    vi.spyOn(emoteService, 'checkEmoteExists').mockResolvedValue(true);
    vi.spyOn(commentService, 'findMissingIDs').mockResolvedValue([]);
    vi.spyOn(emoteService, 'getCommentEmotes').mockResolvedValue([{} as any]);
    const commentID = 'testID';
    const userID = 'userID';
    const emoteRemoveSpy = vi
      .spyOn(emoteService, 'removeFromComment')
      .mockImplementation(async () => []);
    const response = await Emote.DeleteCommentEmote(
      { params: { commentID } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    expect(emoteRemoveSpy).toHaveBeenCalledWith({ commentID, userID });
  });
});
