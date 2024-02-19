import { test, expect, describe, vi, afterEach, beforeEach } from 'vitest';
import { users as userDB } from '@/db';
import bcrypt from 'bcrypt';
import { errorIDs } from '@blogfolio/types';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { Resources } from '@blogfolio/types/User';
import UserController from '../User';
import * as controllerUtils from '../util';

// Test the base controller implementations, skipping the request/response parsing
const User = UserController.__baseHandlers;

const testUsers = [
  {
    id: 'test',
    username: 'testuser',
    firstName: 'Tester',
    lastName: null,
    bio: null,
    followerCount: 5,
    followingCount: 2,
    photoSmall: 'test',
    photoFull: 'test',
  },
  {
    id: 'test2',
    username: 'testuser2',
    firstName: 'Tester2',
    lastName: 'tester2',
    bio: null,
    followerCount: 2,
    followingCount: 2,
    photoSmall: 'test',
    photoFull: 'test',
  },
];

async function testUserIDNotFound(apiCall: () => Promise<any>) {
  const id = 'testID';
  vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([{ id }]);

  const response = await apiCall();

  expect(response.status).toBe(ErrorCode.NotFound);
  if (response.status === ErrorCode.NotFound) {
    expect(response.body.errors.length).toBe(1);
    expect(response.body.errors[0]).toMatchObject({
      ...errorIDs.User.UserNotFound,
      data: { id },
    });
  }
}

function mockUserIdExists() {
  vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Get:', () => {
  test('User ID not found: HTTP error 404, Api error: User not found', async () => {
    const getUserDb = vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([]);
    const response = await User.Get({ params: { id: 'test' }, query: {} });
    expect(getUserDb).toHaveBeenCalled();
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toContain(errorIDs.User.UserNotFound);
    }
  });
  test('Valid user: Maps and passes query to DB handler, HTTP Success Ok w/ output', async () => {
    const user = testUsers[0];
    const query = {
      fields: ['bio', 'firstName', 'lastName'] as unknown as Array<
      keyof typeof user
      >,
    };

    const dbQuery = vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([user]);
    const response = await User.Get({
      params: { id: user.id },
      query: { fields: ['bio', 'firstName', 'lastName'] },
    });
    expect(dbQuery.mock.calls[0][0]).toMatchObject({
      id: user.id,
      fields: query.fields,
    });

    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      const returnedUserData = [
        ...query.fields,
        'id' as keyof typeof user,
      ].reduce((obj, key) => ({ ...obj, [key]: user[key] }), {});

      expect(response.body).toMatchObject({ data: { user: returnedUserData } });
    }
  });
});

describe('GetFollowers', () => {
  test('User ID not found: HTTP error 404, Api error: User not found', async () => {
    await testUserIDNotFound(() =>
      User.GetFollowers({ params: { id: 'test' }, query: {} }),
    );
  });

  test('User found & has followers: HTTP  Ok w/ followers', async () => {
    const testID = 'testerID';
    vi.spyOn(userDB.find, 'run').mockResolvedValue([
      { id: testID, email: 'rand@emai.com', username: 'randuser' },
    ]);
    vi.spyOn(userDB.getUsers, 'run').mockResolvedValue(testUsers);

    const response = await User.GetFollowers({
      params: { id: 'testerID' },
      query: {},
    });

    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "data": {
            "users": [
              {
                "id": "${testUsers[0].id}",
                "username": "${testUsers[0].username}",
              },
              {
                "id": "${testUsers[1].id}",
                "username": "${testUsers[1].username}",
              },
            ],
          },
          "status": "success",
        },
        "status": ${SuccessCode.Ok},
      }
    `);
  });
});

describe('GetFollows', () => {
  test('User ID not found: HTTP error 404, Api error: User not found', async () => {
    await testUserIDNotFound(() =>
      User.GetFollows({ params: { id: 'test' }, query: {} }),
    );
  });

  test('User found & has followers: HTTP Success Ok. Respond with followers', async () => {
    const testID = 'testerID';
    vi.spyOn(userDB.find, 'run').mockResolvedValue([
      { id: testID, email: 'rand@emai.com', username: 'randuser' },
    ]);
    const dbQuery = vi
      .spyOn(userDB.getUsers, 'run')
      .mockResolvedValue(testUsers);
    const response = await User.GetFollows({
      params: { id: 'testerID' },
      query: { fields: ['bio'] },
    });
    expect(dbQuery.mock.calls[0][0]).toMatchObject({ followsId: testID });
    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "data": {
            "users": [
              {
                "bio": ${testUsers[0].bio},
                "id": "${testUsers[0].id}",
                "username": "${testUsers[0].username}",
              },
              {
                "bio": ${testUsers[1].bio},
                "id": "${testUsers[1].id}",
                "username": "${testUsers[1].username}",
              },
            ],
          },
          "status": "success",
        },
        "status": ${SuccessCode.Ok},
      }
    `);
  });
});

describe('GetExistsEmail', () => {
  test('Email exists: HTTP and truthy result', async () => {
    const testEmail = 'rand@email.com';
    vi.spyOn(userDB.find, 'run').mockResolvedValue([
      { id: 'testerID', email: testEmail, username: 'randuser' },
    ]);
    const response = await User.GetExistsEmail({
      params: { email: testEmail },
    });
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.result).toBe(true);
    }
  });
  test('Email doesnt exist: HTTP Success and falsey result', async () => {
    const findUserDb = vi.spyOn(userDB.find, 'run').mockResolvedValue([]);
    const response = await User.GetExistsEmail({
      params: { email: 'testEmail' },
    });
    expect(findUserDb).toHaveBeenCalled();
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.result).toBe(false);
    }
  });
});

describe('GetExistsUsername', () => {
  test('Username exists: HTTP and truthy result', async () => {
    const testUsername = 'test';
    const findUserDb = vi
      .spyOn(userDB.find, 'run')
      .mockResolvedValue([
        { id: 'testerID', email: 'rand@email.com', username: testUsername },
      ]);
    const response = await User.GetExistsUsername({
      params: { username: testUsername },
    });
    expect(findUserDb).toHaveBeenCalled();
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.result).toBe(true);
    }
  });
  test('Username doesnt exist: HTTP Success Ok and falsey result', async () => {
    const findUserDb = vi.spyOn(userDB.find, 'run').mockResolvedValue([]);
    const response = await User.GetExistsUsername({
      params: { username: 'testUsername' },
    });
    expect(findUserDb).toHaveBeenCalled();
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body.data.result).toBe(false);
    }
  });
});

describe('GetSearchUsername', () => {
  const searchedUsername = 'test';
  test('Results exist: HTTP Success Ok and response includes results', async () => {
    const searchDb = vi
      .spyOn(userDB.getUsers, 'run')
      .mockResolvedValue(testUsers);
    const response = await User.GetSearchUsername({
      params: { username: searchedUsername },
      query: {},
    });
    expect(searchDb.mock.calls[0][0]).toMatchObject({
      searchUsername: searchedUsername,
    });
    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "data": {
            "users": [
              {
                "id": "${testUsers[0].id}",
                "username": "${testUsers[0].username}",
              },
              {
                "id": "${testUsers[1].id}",
                "username": "${testUsers[1].username}",
              },
            ],
          },
          "status": "success",
        },
        "status": ${SuccessCode.Ok},
      }
    `);
  });

  test('No results: HTTP Success Ok and an empty array', async () => {
    vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([]);
    const response = await User.GetSearchUsername({
      params: { username: searchedUsername },
      query: {},
    });

    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toMatchObject({ data: { users: [] } });
    }
  });
});

describe('GetSearchAny', () => {
  const searchText = 'test';
  test('Results exist: HTTP Success Ok and response includes results', async () => {
    const searchDb = vi
      .spyOn(userDB.getUsers, 'run')
      .mockResolvedValue(testUsers);
    const response = await User.GetSearchAny({
      params: { text: searchText },
      query: {},
    });
    expect(searchDb.mock.calls[0][0]).toMatchObject({
      searchAny: searchText,
    });
    expect(response).toMatchInlineSnapshot(`
      {
        "body": {
          "data": {
            "users": [
              {
                "id": "${testUsers[0].id}",
                "username": "${testUsers[0].username}",
              },
              {
                "id": "${testUsers[1].id}",
                "username": "${testUsers[1].username}",
              },
            ],
          },
          "status": "success",
        },
        "status": ${SuccessCode.Ok},
      }
    `);
  });

  test('No results: HTTP Success Ok and an empty array', async () => {
    const searchDb = vi.spyOn(userDB.getUsers, 'run').mockResolvedValue([]);
    const response = await User.GetSearchAny({
      params: { text: searchText },
      query: {},
    });
    expect(searchDb.mock.calls[0][0]).toMatchObject({
      searchAny: searchText,
    });

    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toMatchObject({ data: { users: [] } });
    }
  });
});

describe('GetCheckFollow', () => {
  const [id, followerId] = ['test', 'testFollower'];
  describe('Users dont exist', () => {
    test('Target ID not found: HTTP Error Not Found, API error for the ID', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([{ id }]);

      const response = await User.GetCheckFollow({
        params: { id, followerId },
      });

      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id },
        });
      }
    });

    test('Follower Id not found: HTTP Error Not Found, API error for follower ID', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([
        { id: followerId },
      ]);

      const response = await User.GetCheckFollow({
        params: { id, followerId },
      });

      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });

    test('Both IDs not found: HTTP error 404, Api error for each ID', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([
        { id },
        { id: followerId },
      ]);

      const response = await User.GetCheckFollow({
        params: { id, followerId },
      });

      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(2);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id },
        });
        expect(response.body.errors[1]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });
  });

  describe('Both users exist', () => {
    beforeEach(mockUserIdExists);

    test('Target is followed: HTTP Success Ok, Truthy result', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: true },
      ]);

      const response = await User.GetCheckFollow({
        params: { id, followerId },
      });

      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({ data: { result: true } });
      }
    });

    test('Target isnt followed: HTTP Success Ok, Falsey result', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: false },
      ]);

      const response = await User.GetCheckFollow({
        params: { id, followerId },
      });
      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({ data: { result: false } });
      }
    });
  });
});

describe('Post', () => {
  const newUser: Resources['NewUserRequest'] = {
    email: 'testEmail@email.com',
    username: 'testusername',
    password: 'testpass',
    bio: 'Im a test user',
    firstName: 'Test',
    lastName: 'User',
    photoSmall: 'small.jpg',
    photoFull: 'full.jpg',
  };

  describe('Username or email exist:', () => {
    test('Username already exists: HTTP Conflict. Username in response', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ email, username }) =>
          (username?.length ? [] : [{ email: email?.[0] ?? '' }]),
      );

      const response = await User.Post({ body: newUser });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UsernameExists,
          data: { username: newUser.username },
        });
      }
    });

    test('Email already exists: HTTP Conflict. Email in response', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ email, username }) =>
          (email?.length ? [] : [{ username: username?.[0] ?? '' }]),
      );

      const response = await User.Post({ body: newUser });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.EmailExists,
          data: { email: newUser.email },
        });
      }
    });

    test('Email and username exist: HTTP Conflict. Both in response', async () => {
      mockUserIdExists();

      const response = await User.Post({ body: newUser });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors.length).toBe(2);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.EmailExists,
          data: { email: newUser.email },
        });
        expect(response.body.errors[1]).toMatchObject({
          ...errorIDs.User.UsernameExists,
          data: { username: newUser.username },
        });
      }
    });
  });
  test('Email/username available: HTTP Created & returns gen ID. Hashes pass. Adds to DB.', async () => {
    vi.spyOn(controllerUtils, 'findMissing').mockResolvedValue([
      { email: '!' },
      { username: '!' },
    ]);

    const testID = 'testID';
    const mockHasher = (pass: string) => `${pass}Hash`;

    vi.spyOn(controllerUtils, 'generateNewId').mockResolvedValue(testID);
    vi.spyOn(controllerUtils, 'generatePasswordHash').mockImplementation(
      async (pass) => mockHasher(pass),
    );

    const addToDBSpy = vi
      .spyOn(userDB.add, 'run')
      .mockImplementation(async () => []);

    const response = await User.Post({ body: newUser });

    expect(addToDBSpy.mock.calls[0][0]).toMatchObject({
      ...newUser,
      id: testID,
      password: mockHasher(newUser.password),
    });
    expect(response.status).toBe(SuccessCode.Created);
    if (response.status === SuccessCode.Created) {
      expect(response.body).toMatchObject({ data: { id: testID } });
    }
  });
});

describe('Put', () => {
  const testID = 'test';
  const newData = {
    bio: 'Im a test user',
    firstName: 'Test',
    lastName: 'User',
    photoSmall: 'small.jpg',
    photoFull: 'full.jpg',
  };

  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() =>
      User.Put({ params: { id: testID }, body: newData }),
    );
  });

  test('User exists: HTTP Success Ok. Respond back with ID. Update DB.', async () => {
    mockUserIdExists();

    const dbUpdateSpy = vi
      .spyOn(userDB.update, 'run')
      .mockImplementation(async () => []);

    const response = await User.Put({ params: { id: testID }, body: newData });

    expect(dbUpdateSpy.mock.calls[0][0]).toMatchObject({
      id: testID,
      ...newData,
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toMatchObject({ data: { id: testID } });
    }
  });
});

describe('PutEmail', () => {
  const testID = 'testID';
  const newEmail = 'newEmail';

  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() =>
      User.PutEmail({ params: { id: testID }, body: { email: newEmail } }),
    );
  });
  describe('User ID Exists', () => {
    test('New email already taken. HTTP Conflict Error. Response includes email', async () => {
      mockUserIdExists();

      const response = await User.PutEmail({
        params: { id: testID },
        body: { email: newEmail },
      });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.EmailExists,
          data: { email: newEmail },
        });
      }
    });
  });

  test('New Email available. HTTP Success Ok. Updates email. Responds with ID', async () => {
    vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
      async ({ email }) => (email ? [{ email: email?.[0] ?? '' }] : []),
    );
    const dbEmailSpy = vi
      .spyOn(userDB.update, 'run')
      .mockImplementation(async () => []);

    const response = await User.PutEmail({
      params: { id: testID },
      body: { email: newEmail },
    });

    expect(dbEmailSpy.mock.calls[0][0]).toMatchObject({
      id: testID,
      email: newEmail,
    });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toMatchObject({ data: { id: testID } });
    }
  });
});

describe('PutPassword', () => {
  const id = 'testID';
  const password = 'testPassword';

  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() =>
      User.PutPassword({ params: { id }, body: { password } }),
    );
  });

  describe('User Id found', () => {
    const hashPassword = (pass: string) => `${pass}Hash`;

    beforeEach(() => {
      mockUserIdExists();
      vi.spyOn(controllerUtils, 'generatePasswordHash').mockImplementation(
        async (pass) => hashPassword(pass),
      );
      vi.spyOn(bcrypt, 'compare').mockImplementation(
        async (pass, hash) => hashPassword(pass as string) === hash,
      );
    });

    test('Same password: HTTP Conflict', async () => {
      vi.spyOn(userDB.getPassword, 'run').mockResolvedValue([
        { password: hashPassword(password) },
      ]);

      const response = await User.PutPassword({
        params: { id },
        body: { password },
      });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject(
          errorIDs.User.SamePassword,
        );
      }
    });
    test('New password is different: HTTP Success Ok. Update DB. Respond with ID', async () => {
      vi.spyOn(userDB.getPassword, 'run').mockResolvedValue([
        { password: 'oldPasswordIsDifferent' },
      ]);

      const dbPassSpy = vi
        .spyOn(userDB.update, 'run')
        .mockImplementation(async () => []);

      const response = await User.PutPassword({
        params: { id },
        body: { password },
      });

      expect(dbPassSpy.mock.calls[0][0]).toMatchObject({
        id,
        password,
      });

      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({ data: { id } });
      }
    });
  });
});

describe('PutFollower', () => {
  const targetId = 'target';
  const followerId = 'follower';

  describe('IDs not found:', () => {
    const missingIDs = new Set();
    beforeEach(() => {
      missingIDs.clear();
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ id }) =>
          (id as string[]).flatMap((currID) =>
            (missingIDs.has(currID) ? [{ id: currID }] : []),
          ),
      );
    });
    test('Target Id not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(targetId);
      const response = await User.PutFollower({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: targetId },
        });
      }
    });
    test('Follower Id not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(followerId);
      const response = await User.PutFollower({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });
    test('Both Ids not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(targetId);
      missingIDs.add(followerId);
      const response = await User.PutFollower({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(2);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: targetId },
        });
        expect(response.body.errors[1]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });
  });
  describe('Both IDs exist', () => {
    beforeEach(mockUserIdExists);

    test('Follower already follows target', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: true },
      ]);

      const response = await User.PutFollower({
        params: { id: targetId, followerId },
      });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.AlreadyFollowing,
          data: {
            target: { id: targetId },
            follower: { id: followerId },
          },
        });
      }
    });
    test('Follower doesnt follow target: HTTP Success. Update Db. Respond with both IDs', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: false },
      ]);

      const dbFollowerSpy = vi
        .spyOn(userDB.addFollow, 'run')
        .mockImplementation(async () => []);

      const response = await User.PutFollower({
        params: { id: targetId, followerId },
      });

      expect(dbFollowerSpy.mock.calls[0][0]).toMatchObject({
        id: targetId,
        followerId,
      });

      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({
          data: {
            target: { id: targetId },
            follower: { id: followerId },
          },
        });
      }
    });
  });
});

describe('PutActivate', () => {
  const id = 'testID';
  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() => User.PutActivate({ params: { id } }));
  });
  describe('User exists', () => {
    beforeEach(mockUserIdExists);
    test('User already activated: HTTP Conflict. Response has user ID.', async () => {
      vi.spyOn(userDB.checkActive, 'run').mockResolvedValue([{ active: true }]);

      const response = await User.PutActivate({ params: { id } });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.AlreadyActivated,
          data: { id },
        });
      }
    });
    test('User wasnt activated previosuly: HTTP Success Ok. Response has user ID. Update DB', async () => {
      vi.spyOn(userDB.checkActive, 'run').mockResolvedValue([
        { active: false },
      ]);
      const dbActivationSpy = vi
        .spyOn(userDB.activate, 'run')
        .mockImplementation(async () => []);

      const response = await User.PutActivate({ params: { id } });

      expect(dbActivationSpy.mock.calls[0][0]).toMatchObject({ id });
      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body.data.id).toBe(id);
      }
    });
  });
});

describe('PutUsername', () => {
  const id = 'testID';
  const username = 'testUsername';
  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() =>
      User.PutUsername({ params: { id }, body: { username } }),
    );
  });
  describe('User ID exists', () => {
    test('Username already exists: HTTP Conflict. Respond with username', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ id: ID, username: user }) => {
          if (ID?.length) return [];
          return user?.length ? [] : [{ username: 'test' }];
        },
      );

      const response = await User.PutUsername({
        params: { id },
        body: { username },
      });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UsernameExists,
          data: { username },
        });
      }
    });

    test('Username doesnt exist: HTTP Ok. Respond with ID. Update DB', async () => {
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ id: ID, username: user }) => {
          if (ID?.length) return [];
          return user?.length ? [{ username }] : [];
        },
      );
      const dbUsernameSpy = vi
        .spyOn(userDB.update, 'run')
        .mockImplementation(async () => []);

      const response = await User.PutUsername({
        params: { id },
        body: { username },
      });

      expect(dbUsernameSpy.mock.calls[0][0]).toMatchObject({ id, username });
      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({ data: { id } });
      }
    });
  });
});

describe('Delete', () => {
  const id = 'testID';
  test('User Id not found: HTTP Error Not found. Include ID in response', async () => {
    await testUserIDNotFound(() => User.Delete({ params: { id } }));
  });
  test('User Id exists: HTTP Ok. Respond with ID. Delete from DB.', async () => {
    mockUserIdExists();
    const dbDropSpy = vi
      .spyOn(userDB.drop, 'run')
      .mockImplementation(async () => []);

    const response = await User.Delete({ params: { id } });

    expect(dbDropSpy.mock.calls[0][0]).toMatchObject({ ids: [id] });
    expect(response.status).toBe(SuccessCode.Ok);
    if (response.status === SuccessCode.Ok) {
      expect(response.body).toMatchObject({ data: { id } });
    }
  });
});

describe('DeleteFollow', () => {
  const targetId = 'target';
  const followerId = 'follower';

  describe('IDs not found:', () => {
    const missingIDs = new Set();
    beforeEach(() => {
      missingIDs.clear();
      vi.spyOn(controllerUtils, 'findMissing').mockImplementation(
        async ({ id }) =>
          (id as string[]).flatMap((currID) =>
            (missingIDs.has(currID) ? [{ id: currID }] : []),
          ),
      );
    });
    test('Target Id not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(targetId);
      const response = await User.DeleteFollow({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: targetId },
        });
      }
    });
    test('Follower Id not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(followerId);
      const response = await User.DeleteFollow({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(1);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });
    test('Both Ids not found: HTTP Error Not found. Include ID in response', async () => {
      missingIDs.add(targetId);
      missingIDs.add(followerId);
      const response = await User.DeleteFollow({
        params: { id: targetId, followerId },
      });
      expect(response.status).toBe(ErrorCode.NotFound);
      if (response.status === ErrorCode.NotFound) {
        expect(response.body.errors.length).toBe(2);
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: targetId },
        });
        expect(response.body.errors[1]).toMatchObject({
          ...errorIDs.User.UserNotFound,
          data: { id: followerId },
        });
      }
    });
  });
  describe('Users exist', () => {
    beforeEach(mockUserIdExists);

    test('Target not followed. HTTP Conflict. Respond with IDs', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: false },
      ]);

      const response = await User.DeleteFollow({
        params: { id: targetId, followerId },
      });

      expect(response.status).toBe(ErrorCode.Conflict);
      if (response.status === ErrorCode.Conflict) {
        expect(response.body.errors[0]).toMatchObject({
          ...errorIDs.User.NotFollowing,
          data: { target: { id: targetId }, follower: { id: followerId } },
        });
      }
    });
    test('Target was followed: HTTP Success Ok. Respond with IDs. Update DB', async () => {
      vi.spyOn(userDB.checkFollow, 'run').mockResolvedValue([
        { doesFollow: true },
      ]);
      const dbFollowDeleteSpy = vi
        .spyOn(userDB.removeFollow, 'run')
        .mockImplementation(async () => []);

      const response = await User.DeleteFollow({
        params: { id: targetId, followerId },
      });

      expect(dbFollowDeleteSpy.mock.calls[0][0]).toMatchObject({
        id: targetId,
        followerId,
      });

      expect(response.status).toBe(SuccessCode.Ok);
      if (response.status === SuccessCode.Ok) {
        expect(response.body).toMatchObject({
          data: {
            target: { id: targetId },
            follower: { id: followerId },
          },
        });
      }
    });
  });
});
