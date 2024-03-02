import { post as Post } from '@/services/post';
import { Post as PostTypes } from '@blogfolio/types';
import { createController } from '../util';

export default createController('Post', PostTypes.endpoints, (error) => ({
  async Get({ params: { id } }, { createResponse, createError, codes }) {
    const post = await Post.get(id);
    // Ensure that the post is public
    if (post && post.visible) {
      return createResponse(codes.success.Ok, { data: { post } });
    }

    return createResponse(codes.error.NotFound, {
      errors: [createError(error.Post.NotFound, { id })],
    });
  },

  async GetByUserID(
    { query: { drafts, limit, nextID, search, sort = 'views' } },
    { createResponse, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const posts = await Post.getByUserID(userID, {
      searchTerm: search,
      limit,
      nextID,
      visible: !drafts,
      sortByDate: sort === 'date',
    });
    return createResponse(codes.success.Ok, { data: { posts } });
  },

  async GetByUsername(
    { params: { username }, query: { limit, nextID, search, sort = 'date' } },
    { createResponse, codes },
  ) {
    const posts = await Post.getByUsername(username, {
      searchTerm: search,
      limit,
      nextID,
      sortByDate: sort === 'date',
    });
    return createResponse(codes.success.Ok, { data: { posts } });
  },

  async GetSearch(
    { query: { search, limit, nextID, sort = 'views' } },
    { createResponse, codes },
  ) {
    const posts = await Post.search(search, {
      limit,
      nextID,
      sortByDate: sort === 'date',
    });
    return createResponse(codes.success.Ok, { data: { posts } });
  },

  // @ts-expect-error TS expects the missing username response, but thats handled in middleware
  async GetBySlug(
    { params: { slug, username } },
    { createResponse, createError, codes },
  ) {
    const post = await Post.getBySlug(slug, username);
    if (!post) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { slug })],
      });
    }
    return createResponse(codes.success.Ok, { data: { post } });
  },

  async Post(
    { body: { body, title, slug, summary } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const slugAvailable = await Post.checkSlug(userID, slug);
    if (!slugAvailable) {
      return createResponse(codes.error.Conflict, {
        errors: [createError(error.Post.UnavailableSlug, { slug })],
      });
    }
    const postID = await Post.generateID();
    await Post.create({ body, title, slug, summary, userID, postID });
    return createResponse(codes.success.Created, { data: { id: postID } });
  },

  async Put(
    { params: { id }, body: { body, slug, summary, title, visible } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const post = await Post.get(id);
    if (!post) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id })],
      });
    }

    if (post.userID !== userID) {
      if (post.visible) {
        return createResponse(codes.error.Unauthorized, { errors: [] });
      }
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id })],
      });
    }

    if (slug) {
      const slugAvailable = await Post.checkSlug(userID, slug);
      if (!slugAvailable) {
        return createResponse(codes.error.Conflict, {
          errors: [createError(error.Post.UnavailableSlug, { slug })],
        });
      }
    }

    await Post.update(id, { slug, body, summary, title, visible });
    return createResponse(codes.success.Ok, {});
  },

  async PutView({ params: { id } }, { createResponse, createError, codes }) {
    const post = await Post.get(id);
    if (!post || !post.visible) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id })],
      });
    }
    await Post.addView(id);
    return createResponse(codes.success.Ok, {});
  },

  async Delete(
    { params: { id } },
    { createResponse, createError, codes },
    { res },
  ) {
    const { userID } = res.locals;
    const post = await Post.get(id);

    if (!post) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id })],
      });
    }

    if (post.userID !== userID) {
      if (post.visible) {
        return createResponse(codes.error.Unauthorized, { errors: [] });
      }
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { id })],
      });
    }

    await Post.remove(id);

    return createResponse(codes.success.Ok, {});
  },

  async CheckSlug(
    { params: { username, slug } },
    { createResponse, createError, codes },
  ) {
    const exists = await Post.getBySlug(slug, username);
    if (!exists) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(error.Post.NotFound, { slug })],
      });
    }

    return undefined as any;
  },
}));
