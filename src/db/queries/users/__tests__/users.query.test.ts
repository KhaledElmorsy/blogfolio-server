import {
  it,
  beforeAll,
  expect,
  describe,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import {
  testData,
  generateDBInserts,
  fieldIsNull,
  fieldValuesMatch,
} from '@/db/test-utils';
import { omit } from '@/util';
import pool from '@/db/pool';
import { PoolClient } from 'pg';
import type { Invert, IndexInterface } from '@/util';
import * as userDB from '../users.queries';
import UserHelper, {
  type User as SrcUser,
  type UserField as SrcUserField,
} from './UserHelper';

const helper = new UserHelper({
  users: testData.users,
  userFollows: testData.user_follows,
});

type QueryField = userDB.user_fields | userDB.user_sortable;
type CalculatedFields = Extract<QueryField, 'followingCount' | 'followerCount'>;
type StoredFields = Exclude<QueryField, CalculatedFields>;

const fieldMap = {
  bio: 'bio',
  firstName: 'first_name',
  lastName: 'last_name',
  username: 'username',
  photoSmall: 'photo_small',
  photoFull: 'photo_full',
} as const satisfies Record<StoredFields, SrcUserField>;

const fieldToColMap = {
  ...fieldMap,
  email: 'email',
  username: 'username',
  id: 'user_uid',
  pk: 'user_id',
  password: 'password',
} as const;

type FieldToColumnMap = typeof fieldToColMap;

type ColumnToFieldMap = Invert<FieldToColumnMap>;

const colToFieldMap: ColumnToFieldMap = Object.fromEntries(
  Object.entries(fieldToColMap).map((e) => e.reverse()),
);

function mapDBUser<T extends Partial<Record<keyof ColumnToFieldMap, unknown>>>(
  dbUser: T,
) {
  return Object.entries(dbUser).reduce(
    (acc, [col, val]) => ({
      ...acc,
      [colToFieldMap[col as keyof ColumnToFieldMap]]: val,
    }),
    {} as { [f in keyof Partial<FieldToColumnMap>]: T[FieldToColumnMap[f]] },
  );
}

const generateTestUser = (
  suffix: number = 1,
  stringVal = `test${suffix}`,
): userDB.IAddParams => ({
  email: stringVal,
  password: stringVal,
  id: stringVal,
  username: stringVal,
  bio: stringVal,
  firstName: stringVal,
  lastName: stringVal,
  photoFull: stringVal,
  photoSmall: stringVal,
});

beforeAll(async () => {
  await pool.query(
    generateDBInserts(testData, ['users', 'user_follows'], {
      users: {
        user_id: true,
      },
    }),
  );
});

afterAll(async () => {
  await pool.end();
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

describe('getUsers():', () => {
  describe('Query types:', () => {
    it('Queries by user id (uid)', async () => {
      const id = testData.users[3].user_uid;
      const users = await userDB.getUsers.run({ id }, client);
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(id);
    });

    describe('followers/following', () => {
      it("Queries a user's followers", async () => {
        const { user_uid: uid, user_id: targetPk } = testData.users[0];
        const followers = await userDB.getUsers.run(
          { followerId: uid },
          client,
        );
        const actualFollowers = helper.getFollowers(targetPk);

        expect(followers.map(({ id }) => id).sort()).toEqual(
          actualFollowers.map(({ user_uid: id }) => id).sort(),
        );
      });

      it("Queries a user's follows", async () => {
        const { user_uid: uid, user_id: targetPk } = testData.users[0];
        const followed = await userDB.getUsers.run({ followsId: uid }, client);
        const actualFollowing = helper.getFollowing(targetPk);

        expect(followed.map(({ id }) => id).sort()).toEqual(
          actualFollowing.map(({ user_uid }) => user_uid).sort(),
        );
      });
    });
    it('Searches by username (prefix/suffix)', async () => {
      const query = 'A';
      const users = await userDB.getUsers.run(
        { searchUsername: query },
        client,
      );
      const userIds = users.map(({ id }) => id);
      const actualIDs = testData.users
        .filter(({ username }) =>
          username.toLowerCase().includes(query.toLowerCase()),
        )
        .map(({ user_uid: id }) => id);
      if (!actualIDs.length) {
        console.warn('Query doesnt match any users, try a more general one');
      }
      expect(userIds.sort()).toEqual(actualIDs.sort());
    });

    it('Searches by username/firstName/lastName', async () => {
      const query = 'A';
      const users = await userDB.getUsers.run({ searchAny: query }, client);

      const processedQuery = query.toLowerCase();
      const userIds = users.map(({ id }) => id);
      const actualIDs = testData.users
        .filter(
          ({ username, first_name, last_name }) =>
            username.toLowerCase().includes(processedQuery)
            || (first_name ?? '').toLowerCase().includes(processedQuery)
            || (last_name ?? '').toLowerCase().includes(processedQuery),
        )
        .map(({ user_uid: id }) => id);
      if (!actualIDs.length) {
        console.warn('Query doesnt match any users, try a more general one');
      }
      expect(userIds.sort()).toEqual(actualIDs.sort());
    });
  });
  describe('Query customization:', () => {
    it('Can limit the result size', async () => {
      const unlimited = await userDB.getUsers.run({}, client);
      expect(unlimited.length).toBeGreaterThan(2);
      const limit = 2;
      const limited = await userDB.getUsers.run({ limit }, client);
      expect(limited.length).toBe(limit);
    });

    it('Optionally incldues/excludes certain stored fields (Excluded field values are null)', async () => {
      type OptionalStoredField = Exclude<StoredFields, 'username'>;
      const fields: OptionalStoredField[] = [
        'bio',
        'firstName',
        'lastName',
        'photoFull',
        'photoSmall',
      ];
      const basicResults = await userDB.getUsers.run({}, client);
      const fieldsAreExcluded = fields.every((field) =>
        fieldIsNull(basicResults, field),
      );
      expect(fieldsAreExcluded).toBe(true);

      const fieldMapEntries = Object.entries(fieldMap).filter(([field]) =>
        fields.includes(field as OptionalStoredField),
      ) as [OptionalStoredField, SrcUserField][];

      const splitIndex = 2;
      const firstTest = [
        fieldMapEntries.slice(0, splitIndex),
        fieldMapEntries.slice(splitIndex),
      ];
      const flippedTest = firstTest.reverse();
      const testResults = await Promise.all(
        [firstTest, flippedTest].map(
          async ([pickedEntries, ignoredEntries]) => {
            const pickedFields = pickedEntries.map(([field]) => field);
            const results = await userDB.getUsers.run(
              { fields: pickedFields },
              client,
            );
            return (
              fieldValuesMatch({
                inputData: results as IndexInterface<
                (typeof results)[number]
                >[],
                inputKey: 'id',
                targetData: testData.users,
                targetKey: 'user_uid',
                fieldMap: Object.fromEntries(pickedEntries),
              })
              && ignoredEntries.every(([ignoredField]) =>
                fieldIsNull(results, ignoredField),
              )
            );
          },
        ),
      );
      expect(testResults.every(Boolean)).toBe(true);
    });

    it.each([
      ['followerCount', { getCount: helper.getFollowerCount.bind(helper) }],
      ['followingCount', { getCount: helper.getFollowingCount.bind(helper) }],
    ] as const)('Optionally returns %s', async (field, { getCount }) => {
      const { user_id: pk, user_uid: id } = testData.users[0];
      const actualCount = getCount(pk);
      const [result] = await userDB.getUsers.run(
        { id, fields: [field] },
        client,
      );
      if (result[field] === null) {
        throw new Error(`${field} shouldn't be null.`);
      }
      expect(result[field]).toBe(actualCount);
    });
  });

  describe('Sorting and pagination:', () => {
    const testSortFields: [userDB.user_sortable, userDB.sort_direction][] = [
      ['followingCount', 'desc'],
      ['lastName', 'asc'],
      ['username', 'desc'],
    ];

    const sortCols = testSortFields.map(([col]) => col);
    const sortDir = testSortFields.map(([, dir]) => dir);

    const actualSortedIds = testData.users
      .map((user) => ({
        ...user,
        followingCount: helper.getFollowingCount(user.user_id),
      }))
      .sort((a, b) => {
        if (a.followingCount !== b.followingCount) {
          return b.followingCount - a.followingCount;
        }
        if (a.last_name !== b.last_name) {
          if (a.last_name === null) return 1;
          if (b.last_name === null) return -1;
          return a.last_name.toLowerCase() < b.last_name.toLowerCase() ? -1 : 1;
        }
        if (a.username !== b.username) {
          return b.username.toLowerCase() > a.username.toLowerCase() ? 1 : -1;
        }
        return a.user_uid.toLowerCase() < b.user_uid.toLowerCase() ? -1 : 1;
      })
      .map(({ user_uid }) => user_uid);

    it('Sorts by multiple valid sortable fields', async () => {
      const sortedResults = await userDB.getUsers.run(
        { sortCols, sortDir },
        client,
      );
      const sortedIds = sortedResults.map(({ id }) => id);
      expect(sortedIds).toEqual(actualSortedIds);
    });

    // TODO Fix this failing test
    it.skip('Paginates results', async () => {
      const limit = 5;
      const firstPage = await userDB.getUsers.run(
        { limit, sortCols, sortDir },
        client,
      );
      const nextId = firstPage.at(-1)?.id;
      const testPage = await userDB.getUsers.run(
        { limit, sortCols, sortDir, nextId },
        client,
      );
      const testPageIds = testPage.map(({ id }) => id);
      expect(testPageIds).toEqual(actualSortedIds.slice(5, 10));
    });
  });
});

describe('find():', () => {
  type FindableField = keyof userDB.IFindParams;
  type FindResultCol = keyof userDB.IFindResult;

  const findFieldMap = {
    emails: 'email',
    ids: 'id',
    usernames: 'username',
  } as const satisfies { [f in FindableField]: FindResultCol };

  type FindQuery = {
    [f in FindableField]: userDB.IFindResult[(typeof findFieldMap)[f]][];
  };

  it.each([
    [
      'emails',
      {
        query: { emails: [testData.users[0].email] } as Partial<FindQuery>,
        fakeQuery: { emails: ['notAnEmail'] } as Partial<FindQuery>,
      },
    ],
    [
      'ids',
      {
        query: { ids: [testData.users[0].user_uid] },
        fakeQuery: { ids: ['nope'] },
      },
    ],
    [
      'usernames',
      {
        query: { usernames: [testData.users[0].username] },
        fakeQuery: { usernames: ['hopeThisWasntGenerated'] },
      },
    ],
    [
      'All of the above',
      {
        query: {
          usernames: [testData.users[0].username],
          emails: [testData.users[1].email],
          ids: [testData.users[2].user_uid],
        },
        fakeQuery: {
          usernames: ['its'],
          emails: ['a'],
          ids: ['trap'],
        },
      },
    ],
  ])('Correctly queries: %s', async (_, { query, fakeQuery }) => {
    const mergedQueryEntries = Object.keys(findFieldMap).map(
      (field) =>
        [
          field as FindableField,
          [
            ...(query[field as FindableField] ?? [null]),
            ...(fakeQuery[field as FindableField] ?? []),
          ],
        ] as const,
    );
    const mergedQuery = Object.fromEntries(mergedQueryEntries) as FindQuery;
    const results = await userDB.find.run({ ...mergedQuery }, client);
    Object.entries(query).forEach(([field, vals]) => {
      expect(
        vals.every((v) =>
          results.some((r) => r[findFieldMap[field as FindableField]] === v),
        ),
      ).toBe(true);
    });
    Object.entries(fakeQuery).forEach(([field, vals]) => {
      expect(
        vals.every((v) =>
          results.every((r) => r[findFieldMap[field as FindableField]] !== v),
        ),
      ).toBe(true);
    });
  });
});

describe('getPassword()', () => {
  it("Returns the queried user's password", async () => {
    const { user_uid: id, password: actualPass } = testData.users[0];
    const [{ password }] = await userDB.getPassword.run({ id }, client);
    expect(password).toBe(actualPass);
  });
});

describe('getPks()', () => {
  it('Maps user IDs to primary keys', async () => {
    const testUsers = testData.users.slice(0, 4);
    const testIds = testUsers.map(({ user_uid }) => user_uid);
    const users = await userDB.getPks.run({ ids: testIds }, client);
    testIds.forEach((id) => {
      const resultUser = users.find(({ id: resultId }) => resultId === id);
      const actualUser = testUsers.find(({ user_uid }) => id === user_uid);
      expect(resultUser?.pk).toBe(actualUser?.user_id);
    });
  });
});

describe('getIds()', () => {
  it('Maps user primary keys to IDs', async () => {
    const testUsers = testData.users.slice(0, 4);
    const testPks = testUsers.map(({ user_id }) => user_id);
    const users = await userDB.getIds.run({ pks: testPks }, client);
    testPks.forEach((pk) => {
      const resultUser = users.find(({ pk: resultPk }) => resultPk === pk);
      const actualUser = testUsers.find(({ user_id }) => user_id === pk);
      expect(resultUser?.id).toBe(actualUser?.user_uid);
    });
  });
});

describe('add()', () => {
  it('Adds a new user to the table', async () => {
    const newUser = generateTestUser();
    await userDB.add.run(newUser, client);
    const result = await client.query(
      'SELECT * from users WHERE user_uid = $1',
      [newUser.id],
    );
    const addedUser = result.rows[0];
    const mappedDBUser = mapDBUser(addedUser);
    expect(mappedDBUser).toEqual(expect.objectContaining(newUser));
  });
});

describe('update()', () => {
  it('Update multiple columns', async () => {
    const updateData = generateTestUser();
    const baseUser = testData.users[0];
    const userId = baseUser.user_uid;
    await userDB.update.run({ ...updateData, id: userId }, client);
    const results = await client.query(
      'SELECT * FROM users WHERE user_uid = $1',
      [userId],
    );
    const updatedUser = results.rows[0];
    expect(mapDBUser(updatedUser)).toEqual(
      expect.objectContaining({ ...updateData, id: userId }),
    );
  });

  it('Partially updates users', async () => {
    const update: Omit<userDB.IUpdateParams, 'id'> = {
      username: 'test',
      email: 'test',
    };
    const baseUser = testData.users[0];
    const userId = baseUser.user_uid;
    await userDB.update.run({ id: userId, ...update }, client);
    const results = await client.query(
      'SELECT * FROM users WHERE user_uid = $1',
      [userId],
    );
    const updatedUser = results.rows[0];
    expect(updatedUser).toEqual(
      expect.objectContaining(omit({ ...baseUser, ...update }, ['user_id'])),
    );
  });
});

describe('drop()', () => {
  async function usersExist({
    pks = [],
    ids = [],
  }: { pks?: SrcUser['user_id'][]; ids?: SrcUser['user_uid'][] } = {}) {
    const results = await client.query(
      'SELECT * FROM users WHERE user_uid = ANY($1) OR user_id = ANY($2);',
      [ids, pks],
    );
    return results.rowCount > 0;
  }

  it('Drops users by id', async () => {
    const idsToDrop = testData.users.slice(0, 4).map(({ user_uid: id }) => id);
    const fakeIds = ['nope', 'not real'];
    const ids = idsToDrop.concat(fakeIds);
    expect(await usersExist({ ids })).toBe(true);
    const deletedUsers = await userDB.drop.run({ ids, pks: [null] }, client);
    expect(await usersExist({ ids })).toBe(false);
    const deletedIds = deletedUsers.map(({ id }) => id);
    expect(deletedIds).toEqual(idsToDrop);
  });

  it('Drops userse by pk', async () => {
    const pksToDrop = testData.users.slice(0, 4).map(({ user_id: id }) => id);
    const fakePks = [-20, -400, 99999];
    const pks = pksToDrop.concat(fakePks);
    expect(await usersExist({ pks })).toBe(true);
    const deletedUsers = await userDB.drop.run({ pks, ids: [null] }, client);
    expect(await usersExist({ pks })).toBe(false);
    const deletedPks = deletedUsers.map(({ pk }) => pk);
    expect(deletedPks).toEqual(pksToDrop);
  });
});

describe('Follow Methods:', () => {
  function getNonFollowingPair(): {
    target: SrcUser | null;
    nonFollower: SrcUser | null;
  } {
    for (const target of testData.users) {
      const followers = helper.getFollowers(target.user_id);
      const followerIdSet = new Set(followers.map(({ user_id: id }) => id));
      const nonFollower = testData.users.find(
        ({ user_id: nonFollowerId }) =>
          nonFollowerId !== target.user_id && !followerIdSet.has(nonFollowerId),
      );
      if (nonFollower) return { target, nonFollower };
    }
    return { target: null, nonFollower: null };
  }

  async function checkFollowActual(targetPk: number, inputPk: number) {
    const result = await client.query(
      'SELECT * FROM user_follows WHERE user_id = $1 AND follower_id = $2',
      [targetPk, inputPk],
    );
    return result.rowCount > 0;
  }

  describe('checkFollow()', () => {
    it('Returns true if the input user follows the target user', async () => {
      const { user_id: targetPk, follower_id: followerPk } = testData.user_follows[0];
      const target = helper.userMaps.id[targetPk];
      const follower = helper.userMaps.id[followerPk];
      const [{ doesFollow }] = await userDB.checkFollow.run(
        {
          id: target.user_uid,
          followerId: follower.user_uid,
        },
        client,
      );
      expect(doesFollow).toBe(true);
    });
    it('Returns false if the input user doesnt follow the target user', async () => {
      const { target, nonFollower } = getNonFollowingPair();
      if (!target) throw new Error("Couldn't find a user without followers.");
      const [{ doesFollow }] = await userDB.checkFollow.run(
        { id: target.user_uid, followerId: nonFollower?.user_uid },
        client,
      );
      expect(doesFollow).toBe(false);
    });
  });

  describe('addFollow()', () => {
    it('Adds a row in the user follows table with the target & follower IDs', async () => {
      const { target, nonFollower } = getNonFollowingPair();
      if (!target || !nonFollower) {
        throw new Error("Couldn't find a user without followers.");
      }
      await userDB.addFollow.run(
        { id: target.user_uid, followerId: nonFollower?.user_uid },
        client,
      );
      const doesFollow = await checkFollowActual(
        target.user_id,
        nonFollower?.user_id,
      );
      expect(doesFollow).toBe(true);
    });
  });

  describe('removeFollow()', () => {
    it('Removes the follow relation associated with the input users', async () => {
      const { user_id: targetPk, follower_id: followerPk } = testData.user_follows[0];
      const { user_uid: targetId } = helper.userMaps.id[targetPk];
      const { user_uid: followerId } = helper.userMaps.id[followerPk];
      await userDB.removeFollow.run({ id: targetId, followerId }, client);
      const doesFollow = await checkFollowActual(targetPk, followerPk);
      expect(doesFollow).toBe(false);
    });
  });
});

describe('Active status methods:', () => {
  let inactiveId: string;
  beforeEach(async () => {
    const { rows: inactiveUsers } = await client.query(
      'SELECT user_uid FROM users WHERE NOT ACTIVE',
    );
    if (!inactiveUsers.length) {
      throw new Error('No inactive users for testing.');
    }
    inactiveId = inactiveUsers[0].user_uid;
  });
  describe('checkActive()', () => {
    it('Returns false when a users active column is false', async () => {
      const [{ active }] = await userDB.checkActive.run(
        { id: inactiveId },
        client,
      );
      expect(active).toBe(false);
    });
    it('Returns true when a users active column is true', async () => {
      await client.query('UPDATE users SET active = true WHERE user_uid = $1', [
        inactiveId,
      ]);
      const [{ active }] = await userDB.checkActive.run(
        { id: inactiveId },
        client,
      );
      expect(active).toBe(true);
    });
  });
  describe('activate()', () => {
    it('Sets a users active column to true', async () => {
      await userDB.activate.run({ id: inactiveId }, client);
      const {
        rows: [user],
      } = await client.query('SELECT active FROM users WHERE user_uid = $1', [
        inactiveId,
      ]);
      expect(user.active).toBe(true);
    });
  });
});
