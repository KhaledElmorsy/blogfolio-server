import { Comment as CommentType } from '@blogfolio/types';
import { comment as Comment, user as User, post as Post } from '@/services';
import { createController } from '../util';

export default createController('Comment', CommentType.endpoints, (error) => ({
  async Get({ params: { id } }, { createResponse, createError, codes }) {
    const [comment] = await Comment.getByIDs([id]);
    if (!comment) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id })],
      });
    }
    return createResponse(codes.success.Ok, { data: { comment } });
  },

  // @ts-expect-error TODO Look into types with similar errors mixing the data shape
  async GetByRelation(
    { query: { limit, nextID, popular, postID, userID } },
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
    if (postID) {
      const postExists = await Post.get(postID);
      if (!postExists) {
        return createResponse(codes.error.NotFound, {
          errors: [createError(error.Post.NotFound, { id: postID })],
        });
      }
    }

    const comments = await Comment.findByRelation(
      { userID, postID },
      { limit, nextID, popular },
    );

    return createResponse(codes.success.Ok, { data: { comments } });
  },

  async GetBySlug(
    { params: { slug, username }, query: { limit, nextID, popular } },
    { createResponse, codes },
  ) {
    // Username and slug handled by middleware

    const comments = await Comment.findBySlug(username, slug, {
      limit,
      nextID,
      popular,
    });
    return createResponse(codes.success.Ok, { data: { comments } });
  },

  async Post(
    { body: { body, postID, parentID } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const postExists = await Post.get(postID);
    if (!postExists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id: postID })],
      });
    }
    const id = await Comment.generateID();
    await Comment.create({ body, id, postID, userID, parentID });
    return createResponse(codes.success.Created, { data: { id } });
  },

  async Put(
    { params: { id }, body: { body } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const [comment] = await Comment.getByIDs([id]);
    if (!comment) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id })],
      });
    }
    const commentAuthor = comment.userID;
    if (userID !== commentAuthor) {
      return createResponse(codes.error.Unauthorized, { errors: [] });
    }
    await Comment.edit(id, body);
    return createResponse(codes.success.Ok, {});
  },

  async Delete(
    { params: { id } },
    { createResponse, createError, codes },
    { res },
  ) {
    const [comment] = await Comment.getByIDs([id]);
    if (!comment) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Comment.NotFound, { id })],
      });
    }
    const { userID } = res.locals;
    const commentAuthor = comment.userID;
    if (userID !== commentAuthor) {
      return createResponse(codes.error.Unauthorized, { errors: [] });
    }
    await Comment.remove(id);
    return createResponse(codes.success.Ok, {});
  },
}));
