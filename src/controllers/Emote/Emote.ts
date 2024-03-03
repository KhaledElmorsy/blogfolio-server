import {
  emote as Emote,
  post as Post,
  comment as Comment,
  user as User,
} from '@/services';
import { Emote as EmoteType } from '@blogfolio/types';
import { createController } from '../util';

export default createController('Emote', EmoteType.endpoints, (error) => ({
  async Get(_, { createResponse, codes }) {
    const emotes = await Emote.getEmotes();
    return createResponse(codes.success.Ok, { data: emotes });
  },

  async PostGetPostEmotes(
    { body: { ids, userID } },
    { createResponse, createError, codes },
  ) {
    if (userID) {
      const userExists = !(await User.findMissing({ id: [userID] })).length;
      if (!userExists) {
        return createResponse(codes.error.NotFound, {
          errors: [createError(error.User.UserNotFound, { id: userID })],
        });
      }
    }

    const missingPostIDs = await Post.findMissingIDs(ids);
    if (missingPostIDs.length) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { ids: missingPostIDs })],
      });
    }
    const emotes = await Emote.getPostEmotes(ids, userID);
    const mappedResponse = emotes.map((emote) => ({
      userID: emote.userID,
      postID: emote.postID,
      emoteID: emote.id,
    }));
    return createResponse(codes.success.Ok, { data: mappedResponse });
  },

  async PostGetCommentEmotes(
    { body: { ids, userID } },
    { createResponse, createError, codes },
  ) {
    if (userID) {
      const userExists = !(await User.findMissing({ id: [userID] })).length;
      if (!userExists) {
        return createResponse(codes.error.NotFound, {
          errors: [createError(error.User.UserNotFound, { id: userID })],
        });
      }
    }

    const missingCommentIDs = await Comment.findMissingIDs(ids);
    if (missingCommentIDs.length) {
      return createResponse(codes.error.NotFound, {
        errors: [
          createError(error.Comment.NotFound, { ids: missingCommentIDs }),
        ],
      });
    }
    const emotes = await Emote.getCommentEmotes(ids, userID);
    const mappedResponse = emotes.map((emote) => ({
      userID: emote.userID,
      commentID: emote.commentID,
      emoteID: emote.id,
    }));
    return createResponse(codes.success.Ok, { data: mappedResponse });
  },

  async PostNewPostEmote(
    { body: { emoteID, postID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const emoteExists = await Emote.checkEmoteExists(emoteID);
    if (!emoteExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NotFound, { id: emoteID })],
      });
    }
    const postExists = !(await Post.findMissingIDs([postID])).length;

    if (!postExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id: postID })],
      });
    }

    await Emote.addToPost({ emoteID, postID, userID });
    return createResponse(codes.success.Created, {});
  },

  async PostNewCommentEmote(
    { body: { emoteID, commentID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const emoteExists = await Emote.checkEmoteExists(emoteID);
    if (!emoteExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NotFound, { id: emoteID })],
      });
    }
    const commentExists = !(await Comment.findMissingIDs([commentID])).length;

    if (!commentExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id: commentID })],
      });
    }

    await Emote.addToComment({ emoteID, commentID, userID });
    return createResponse(codes.success.Created, {});
  },

  async PutPostEmote(
    { body: { emoteID, postID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;

    const emoteExists = await Emote.checkEmoteExists(emoteID);
    if (!emoteExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NotFound, { id: emoteID })],
      });
    }
    const postExists = !(await Post.findMissingIDs([postID])).length;

    if (!postExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id: postID })],
      });
    }

    const [userEmote] = await Emote.getPostEmotes([postID], userID);
    if (!userEmote) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NoEmotePost, { postID, userID })],
      });
    }

    await Emote.updatePostEmote({ emoteID, postID, userID });
    return createResponse(codes.success.Ok, {});
  },

  async PutCommentEmote(
    { body: { emoteID, commentID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const emoteExists = await Emote.checkEmoteExists(emoteID);
    if (!emoteExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NotFound, { id: emoteID })],
      });
    }
    const commentExists = !(await Comment.findMissingIDs([commentID])).length;

    if (!commentExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id: commentID })],
      });
    }

    const [userEmote] = await Emote.getCommentEmotes([commentID], userID);
    if (!userEmote) {
      return createResponse(codes.error.NotFound, {
        errors: [
          createError(error.Emote.NoEmoteComment, { commentID, userID }),
        ],
      });
    }

    await Emote.updateCommentEmote({ emoteID, commentID, userID });
    return createResponse(codes.success.Ok, {});
  },

  async DeletePostEmote(
    { params: { postID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;

    const postExists = !(await Post.findMissingIDs([postID])).length;

    if (!postExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id: postID })],
      });
    }

    const [userEmote] = await Emote.getPostEmotes([postID], userID);
    if (!userEmote) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Emote.NoEmotePost, { postID, userID })],
      });
    }

    await Emote.removeFromPost({ postID, userID });
    return createResponse(codes.success.Ok, {});
  },

  async DeleteCommentEmote(
    { params: { commentID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;

    const commentExists = !(await Comment.findMissingIDs([commentID])).length;

    if (!commentExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id: commentID })],
      });
    }

    const [userEmote] = await Emote.getCommentEmotes([commentID], userID);
    if (!userEmote) {
      return createResponse(codes.error.NotFound, {
        errors: [
          createError(error.Emote.NoEmoteComment, { commentID, userID }),
        ],
      });
    }

    await Emote.removeFromComment({ commentID, userID });
    return createResponse(codes.success.Ok, {});
  },
}));
