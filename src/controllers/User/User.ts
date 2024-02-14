import { customAlphabet } from 'nanoid';
import bcrypt from 'bcrypt';
import { type Resources, endPoints } from '@blogfolio/types/User';
import { errorIDs, type ResponseError } from '@blogfolio/types';
import { pool, users as userDB } from '@/db';
import {
  pickFields,
  getMissingFieldValues,
  createController,
} from '@/controllers/util';
import { type UserQueryParams, type QueryFields, getUserQuery } from './util';

type BaseUser = Resources['User'];
type QueriedUser = Resources['QueriedUser'];

/* ========================================================================== */
/*                               HELPERS                                      */
/* ========================================================================== */

const DEFAULT_USER_LIST_SIZE_GENERAL = 20;

async function getUserList<T extends UserQueryParams>(
  query: QueryFields,
  reqParams: T,
) {
  const users = await userDB.getUsers.run(getUserQuery(query, reqParams), pool);
  const DEFAULT_USER_FIELDS = [
    'username',
    'id',
  ] satisfies (keyof QueriedUser)[];
  const responseFields = [
    ...DEFAULT_USER_FIELDS,
    ...(reqParams.fields ?? []),
  ] as (
    | (typeof DEFAULT_USER_FIELDS)[number]
    | NonNullable<T['fields']>[number]
  )[];
  const usersCleanedFields = pickFields.array<(typeof users)[number],
  (typeof responseFields)[number]
  >(users, responseFields);
  return usersCleanedFields;
}

async function findMissing<
  F extends {
    id?: BaseUser['id'][];
    email?: BaseUser['email'][];
    username?: BaseUser['username'][];
  },
>(fields: F) {
  const users = await userDB.find.run(
    {
      ids: fields.id ?? [null],
      emails: fields.email ?? [null],
      usernames: fields.username ?? [null],
    },
    pool,
  );
  return getMissingFieldValues<(typeof users)[number], F>(users, fields);
}

async function getMissingIDErrors(
  ids: BaseUser['id'][],
): Promise<ResponseError<typeof errorIDs.User.UserNotFound, { id: string }>[]> {
  const missingValues = await findMissing({ id: ids });
  return missingValues.map(
    (data) =>
      ({
        ...errorIDs.User.UserNotFound,
        data,
      }) as const,
  );
}

const generateId = (() => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const alphabet = `0123456789${letters}${letters.toUpperCase()}`;
  return customAlphabet(alphabet, 8).bind(null, undefined);
})();

async function generateNewId() {
  const MAX_ATTEMPTS = 1000;
  let id;
  let existingUsers;
  let attempts = 0;
  do {
    attempts += 1;
    id = generateId();
    // User.checkExists processes the data, so run a direct DB call instead
    existingUsers = await userDB.getUsers.run({ id }, pool);
  } while (existingUsers.length && attempts < MAX_ATTEMPTS);
  if (attempts === MAX_ATTEMPTS) {
    throw new Error('Could not generate user ID');
  }
  return id;
}

function generatePasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}

/* ========================================================================== */
/*                             Controller                                     */
/* ========================================================================== */

export default createController('User', endPoints, (errors) => ({
  async Get({ params: { id }, query: { fields } }, { codes, response, error }) {
    const [user] = await getUserList({ id }, { fields });
    if (user) {
      return response(codes.success.Ok, { data: { user } });
    }
    return response(codes.error.NotFound, {
      errors: [error(errors.User.UserNotFound, { id })],
    });
  },

  async GetFollowers({ params: { id }, query }, { codes, response }) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, { errors: missingIDErrors });
    }

    const followers = await getUserList(
      { followerId: id },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );

    return response(codes.success.Ok, { data: { users: followers } });
  },

  async GetFollows({ params: { id }, query }, { codes, response }) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, { errors: missingIDErrors });
    }

    const follows = await getUserList(
      { followsId: id },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );

    return response(codes.success.Ok, { data: { users: follows } });
  },

  async GetExistsEmail({ params: { email } }, { codes, response }) {
    const emailExists = (await findMissing({ email: [email] })).length === 0;
    return response(codes.success.Ok, { data: { result: emailExists } });
  },

  async GetExistsUsername({ params: { username } }, { codes, response }) {
    const usernameExists = (await findMissing({ username: [username] })).length === 0;
    return response(codes.success.Ok, { data: { result: usernameExists } });
  },

  async GetSearchUsername(
    { params: { username }, query },
    { codes, response },
  ) {
    const users = await getUserList(
      { searchUsername: username },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );
    return response(codes.success.Ok, { data: { users } });
  },

  async GetSearchAny({ params: { text }, query }, { codes, response }) {
    const users = await getUserList(
      { searchAny: text },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );
    return response(codes.success.Ok, { data: { users } });
  },

  async GetCheckFollow({ params: { followerId, id } }, { codes, response }) {
    const missingIDErrors = await getMissingIDErrors([id, followerId]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, { errors: missingIDErrors });
    }

    const [{ doesFollow }] = await userDB.checkFollow.run(
      { followerId, id },
      pool,
    );
    return response(codes.success.Ok, { data: { result: doesFollow } });
  },

  async Post({ body }, { codes, response, error }) {
    const { email, username, password } = body;

    const [emailExists, usernameExists] = (
      await Promise.all([
        findMissing({ email: [email] }),
        findMissing({ username: [username] }),
      ])
    ).map((missingVals) => !missingVals.length);

    if (emailExists || usernameExists) {
      return response(codes.error.Conflict, {
        errors: [
          ...(emailExists ? [error(errors.User.EmailExists, { email })] : []),
          ...(usernameExists
            ? [error(errors.User.UsernameExists, { username })]
            : []),
        ],
      });
    }
    const [passwordHash, id] = await Promise.all([
      generatePasswordHash(password),
      generateNewId(),
    ]);
    await userDB.add.run(
      {
        ...body,
        password: passwordHash,
        id,
      },
      pool,
    );
    return response(codes.success.Created, { data: { id } });
  },

  async Put({ params: { id }, body }, { codes, response }) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }
    await userDB.update.run({ id, ...body }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async PutEmail(
    { params: { id }, body: { email } },
    { codes, response, error },
  ) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }

    const emailExists = !(await findMissing({ email: [email] })).length;
    if (emailExists) {
      return response(codes.error.Conflict, {
        errors: [error(errors.User.EmailExists, { email })],
      });
    }
    await userDB.update.run({ id, email }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async PutPassword(
    { params: { id }, body: { password } },
    { codes, response, error },
  ) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }
    const [{ password: oldPassHash }] = await userDB.getPassword.run(
      { id },
      pool,
    );
    const samePass = await bcrypt.compare(password, oldPassHash);
    if (samePass) {
      return response(codes.error.Conflict, {
        errors: [error(errors.User.SamePassword)],
      });
    }
    await userDB.update.run({ id, password }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async PutFollower(
    { params: { followerId, id } },
    { codes, response, error },
  ) {
    const missingIDErrors = await getMissingIDErrors([id, followerId]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }
    const [{ doesFollow }] = await userDB.checkFollow.run(
      { id, followerId },
      pool,
    );
    if (doesFollow) {
      return response(codes.error.Conflict, {
        errors: [
          error(errors.User.AlreadyFollowing, {
            follower: { id: followerId },
            target: { id },
          }),
        ],
      });
    }
    await userDB.addFollow.run({ followerId, id }, pool);
    return response(codes.success.Ok, {
      data: { follower: { id: followerId }, target: { id } },
    });
  },

  async PutActivate({ params: { id } }, { codes, response, error }) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }
    const [{ active: isActive }] = await userDB.checkActive.run({ id }, pool);
    if (isActive) {
      return response(codes.error.Conflict, {
        errors: [error(errors.User.AlreadyActivated, { id })],
      });
    }
    await userDB.activate.run({ id }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async PutUsername(
    { params: { id }, body: { username } },
    { codes, response, error },
  ) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }
    const usernameExists = !(await findMissing({ username: [username] }))
      .length;
    if (usernameExists) {
      return response(codes.error.Conflict, {
        errors: [error(errors.User.UsernameExists, { username })],
      });
    }
    await userDB.update.run({ id, username }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async Delete({ params: { id } }, { codes, response }) {
    const missingIDErrors = await getMissingIDErrors([id]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }

    await userDB.drop.run({ ids: [id], pks: [null] }, pool);
    return response(codes.success.Ok, { data: { id } });
  },

  async DeleteFollow(
    { params: { id, followerId } },
    { codes, response, error },
  ) {
    const missingIDErrors = await getMissingIDErrors([id, followerId]);
    if (missingIDErrors.length) {
      return response(codes.error.NotFound, {
        errors: missingIDErrors,
      });
    }

    const [{ doesFollow }] = await userDB.checkFollow.run(
      { id, followerId },
      pool,
    );
    if (!doesFollow) {
      return response(codes.error.Conflict, {
        errors: [
          error(errors.User.NotFollowing, {
            follower: { id: followerId },
            target: { id },
          }),
        ],
      });
    }
    await userDB.removeFollow.run({ followerId, id }, pool);
    return response(codes.success.Ok, {
      data: { follower: { id: followerId }, target: { id } },
    });
  },
}));
