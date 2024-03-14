import { post as postService } from '@/services/post';
import { test, describe, vi, expect, it } from 'vitest';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { errorIDs } from '@blogfolio/types';
import { postSchema } from '@blogfolio/types/Post';
import { Post as PostController } from '..';

const Post = PostController.__baseHandlers;

const testPost: typeof postSchema._output = {
  body: 'body',
  id: 'id',
  createdAt: new Date(),
  editedAt: new Date(),
  slug: 'slug',
  summary: 'summary',
  title: 'title',
  views: 230,
  visible: true,
  userID: 'userID',
};

const { body: BODY, visible: VISIBLE, ...lightTestPost } = testPost;

describe('Get', () => {
  test('Post not found: HTTP Error Not Found. Returns ID.', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const id = 'testID';
    const response = await Post.Get(
      { params: { id } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });

  test('Post Found but hidden: HTTP Error Not Found. Returns ID', async () => {
    // This is a public endpoint, so if a user hides their post, this is safe
    // without leaking data
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: false,
    });
    const { id } = testPost;
    const response = await Post.Get(
      { params: { id } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });

  test('Post written by logged user: HTTP Success Ok. Returns post', async () => {
    const userID = 'testID';
    const mockPost = { ...testPost, visible: false, userID };
    vi.spyOn(postService, 'get').mockResolvedValue(mockPost);
    const { id } = testPost;
    const response = await Post.Get(
      { params: { id } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.post).toMatchObject(mockPost);
    }
  });

  test('Post Found and visible: HTTP Success Ok. Returns post', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(testPost);
    const { id } = testPost;
    const response = await Post.Get(
      { params: { id } },
      { res: { locals: { userID: 'test' } } },
    );
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.post).toMatchObject(testPost);
    }
  });
});

describe('GetByUserID', () => {
  test('User authorized: HTTP Success OK, pass ID to service & respond w/ results', async () => {
    const userID = 'testID';
    const serviceSpy = vi
      .spyOn(postService, 'getByUserID')
      .mockResolvedValue([testPost]);
    const response = await Post.GetByUserID(
      { query: {} },
      { res: { locals: { userID } } },
    );
    expect(serviceSpy).toHaveBeenCalled();
    expect(serviceSpy.mock.calls[0][0]).toBe(userID);
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.posts).toEqual([lightTestPost]);
    }
  });

  it('Passes query options to the service', async () => {
    const drafts = true;
    const limit = 4;
    const nextID = 'nextID';
    const search = 'searchTerm';
    const sort = 'views';
    const serviceSpy = vi.spyOn(postService, 'getByUserID');
    await Post.GetByUserID(
      {
        query: { drafts, limit, nextID, search, sort },
      },
      { res: { locals: { userID: 'test' } } },
    );
    expect(serviceSpy.mock.calls[0][1]).toMatchObject({
      searchTerm: search,
      limit,
      nextID,
      visible: !drafts,
      sortByDate: (sort as string) === 'date',
    });
  });
});

describe('GetByUsername', () => {
  // Username validated by a middleware
  test('HTTP Success OK, pass username to service & respond w/ results', async () => {
    const username = 'username';
    const serviceSpy = vi
      .spyOn(postService, 'getByUsername')
      .mockResolvedValue([testPost]);
    const response = await Post.GetByUsername({
      params: { username },
      query: {},
    });
    expect(serviceSpy).toHaveBeenCalled();
    expect(serviceSpy.mock.calls[0][0]).toBe(username);
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.posts).toEqual([lightTestPost]);
    }
  });

  it('Passes query options to the service', async () => {
    const limit = 4;
    const nextID = 'nextID';
    const search = 'searchTerm';
    const sort = 'views';
    const serviceSpy = vi.spyOn(postService, 'getByUsername');
    await Post.GetByUsername({
      params: { username: 'testUsername' },
      query: { limit, nextID, search, sort },
    });
    expect(serviceSpy.mock.calls[0][1]).toMatchObject({
      searchTerm: search,
      limit,
      nextID,
      sortByDate: (sort as string) === 'date',
    });
  });
});

describe('GetSearch', () => {
  test('HTTP Success OK, pass search term to service & respond w/ results', async () => {
    const search = 'search term';
    const serviceSpy = vi
      .spyOn(postService, 'search')
      .mockResolvedValue([testPost]);
    const response = await Post.GetSearch({
      query: { search },
    });
    expect(serviceSpy).toHaveBeenCalled();
    expect(serviceSpy.mock.calls[0][0]).toBe(search);
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.posts).toEqual([lightTestPost]);
    }
  });

  it('Passes query options to the service', async () => {
    const limit = 4;
    const nextID = 'nextID';
    const sort = 'views';
    const serviceSpy = vi.spyOn(postService, 'search');
    await Post.GetSearch({
      query: { search: 'search term', limit, nextID, sort },
    });
    expect(serviceSpy.mock.calls[0][1]).toMatchObject({
      limit,
      nextID,
      sortByDate: (sort as string) === 'date',
    });
  });
});

describe('GetBySlug', () => {
  test('Post doesnt exist: HTTP Not Found. Responds with slug', async () => {
    const slug = 'slug';
    const username = 'username';
    vi.spyOn(postService, 'getBySlug').mockResolvedValue(undefined);
    const response = await Post.GetBySlug({ params: { username, slug } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { slug },
      });
    }
  });

  test('Post exists: HTTP Success Ok. Responds with post', async () => {
    vi.spyOn(postService, 'getBySlug').mockResolvedValue(testPost);
    const response = await Post.GetBySlug({
      params: { slug: 'slug', username: 'username' },
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.post).toMatchObject(testPost);
    }
  });
});

describe('Post', () => {
  test('Slug not available: HTTP Error Conflict. Respond with slug', async () => {
    const slug = 'slug';
    const userID = 'userID';
    vi.spyOn(postService, 'checkSlug').mockImplementation(async () => false);
    const response = await Post.Post(
      {
        body: { slug, body: 'body', title: 'title' },
      },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.Conflict);
    if (response.status === ErrorCode.Conflict) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.UnavailableSlug,
        data: { slug },
      });
    }
  });
  test('Slug available: HTTP Success Created. Create post. Respond with ID', async () => {
    const postData = {
      body: 'body',
      summary: 'summary',
      slug: 'slug',
      title: 'title',
    };
    const postID = 'testID';
    const userID = 'userID';
    const createServiceSpy = vi
      .spyOn(postService, 'create')
      .mockImplementation(async () => []);
    vi.spyOn(postService, 'checkSlug').mockImplementation(async () => true);
    vi.spyOn(postService, 'generateID').mockImplementation(async () => postID);

    const response = await Post.Post(
      { body: postData },
      { res: { locals: { userID } } },
    );

    expect(createServiceSpy).toHaveBeenCalledWith({
      ...postData,
      postID,
      userID,
    });
    expect(response.status).toBe(SuccessCode.Created);
    if (response.status === SuccessCode.Created) {
      expect(response.body.id).toBe(postID);
    }
  });
});

describe('Put', () => {
  test('Post doesnt exist: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const id = 'testID';
    const response = await Post.Put(
      { params: { id }, body: {} },
      { res: { locals: {} } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });

  // To avoid leaking data
  test('User isnt author & post is hidden: HTTP Error Not found. Respond with ID', async () => {
    const userID = 'badActor';
    const postAuthor = 'victim';
    const id = 'postID';
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: false,
      userID: postAuthor,
    });
    const response = await Post.Put(
      { params: { id }, body: {} },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });
  test('User isnt author & post is visible: HTTP Error Unathorized.', async () => {
    const userID = 'badActor';
    const postAuthor = 'victim';
    const id = 'postID';
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: true,
      userID: postAuthor,
    });
    const response = await Post.Put(
      { params: { id }, body: {} },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Edits include a slug thats not available: HTTP Error Conflict. Respond with slug', async () => {
    const slug = 'post-slug';
    const id = 'postID';
    const userID = 'userID';
    vi.spyOn(postService, 'get').mockResolvedValue({ ...testPost, id, userID });
    vi.spyOn(postService, 'checkSlug').mockResolvedValue(false);
    const response = await Post.Put(
      { params: { id }, body: { slug } },
      { res: { locals: { userID } } },
    );
    expect(response.status).toBe(ErrorCode.Conflict);
    if (response.status === ErrorCode.Conflict) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.UnavailableSlug,
        data: { slug },
      });
    }
  });

  test('Valid user & edits: HTTP Success Ok. Calls editing service with correct data', async () => {
    const userID = 'userID';
    const id = 'postID';
    const edits = {
      body: 'newBody',
      title: 'newTitle',
      slug: 'sluggy',
      visible: false,
      summary: 'wow',
    };
    vi.spyOn(postService, 'get').mockResolvedValue({ ...testPost, id, userID });
    vi.spyOn(postService, 'checkSlug').mockResolvedValue(true);
    const editSpy = vi
      .spyOn(postService, 'update')
      .mockImplementation(async () => []);
    const response = await Post.Put(
      { params: { id }, body: edits },
      { res: { locals: { userID } } },
    );
    expect(editSpy).toHaveBeenCalledWith(id, edits);
    expect(response.status).toBe(SuccessCode.Ok);
  });
});

describe('PutView', () => {
  test('Post doesnt exist: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const id = 'testID';
    const response = await Post.PutView({ params: { id } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });
  test('Post hidden/draft: HTTP Error Not Found. Respond with ID', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: false,
    });
    const id = 'testID';
    const response = await Post.PutView({ params: { id } });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });
  test('Post exists and visible: HTTP Success Ok. Call view incrementing service', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(testPost);
    const viewServiceSpy = vi
      .spyOn(postService, 'addView')
      .mockImplementation(async () => []);
    const id = 'testID';
    const response = await Post.PutView({ params: { id } });
    expect(viewServiceSpy).toHaveBeenCalledWith(id);
    expect(response.status).toBe(SuccessCode.Ok);
  });
});

describe('Delete', () => {
  test('Post doesnt exist: HTTP Error Not found. Respond with ID', async () => {
    vi.spyOn(postService, 'get').mockResolvedValue(undefined);
    const id = 'testID';
    const response = await Post.Delete(
      { params: { id } },
      { res: { locals: { userID: 'userID' } } },
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });

  test('User isnt the author & post is hidden: HTTP Error Not found. Respond with ID', async () => {
    const id = 'testID';
    const authorID = 'victim';
    const userID = 'badActor';
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: false,
      userID: authorID,
    });

    const response = await Post.Delete(
      { params: { id } },
      { res: { locals: { userID } } },
    );

    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { id },
      });
    }
  });

  test('User isnt the author & post is visible: HTTP Error Unauthorized', async () => {
    const id = 'testID';
    const authorID = 'victim';
    const userID = 'badActor';
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      visible: true,
      userID: authorID,
    });

    const response = await Post.Delete(
      { params: { id } },
      { res: { locals: { userID } } },
    );

    expect(response.status).toBe(ErrorCode.Unauthorized);
  });

  test('Post exists and user is the author: HTTP Success Ok. Removes post.', async () => {
    const id = 'testID';
    const userID = 'userID';
    vi.spyOn(postService, 'get').mockResolvedValue({
      ...testPost,
      userID,
    });
    const deleteServiceSpy = vi
      .spyOn(postService, 'remove')
      .mockImplementation(async () => []);

    const response = await Post.Delete(
      { params: { id } },
      { res: { locals: { userID } } },
    );

    expect(deleteServiceSpy).toHaveBeenCalledWith(id);
    expect(response.status).toBe(SuccessCode.Ok);
  });
});

describe('CheckSlug', () => {
  test('Slug/user combo doesnt exist: HTTP Error Not found. Respond with slug.', async () => {
    vi.spyOn(postService, 'getBySlug').mockResolvedValue(undefined);
    const slug = 'slug';
    const response = await Post.CheckSlug({
      params: { slug, username: 'username' },
    });
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject({
        ...errorIDs.Post.NotFound,
        data: { slug },
      });
    }
  });
});
