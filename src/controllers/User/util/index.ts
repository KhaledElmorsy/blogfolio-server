import bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { users as userDB, pool } from '@/db';
import { Resources } from '@blogfolio/types/User';
import { pickFields, getMissingFieldValues } from '@/controllers/util';
import { errorIDs, type ResponseError } from '@blogfolio/types';
import type { OneProperty } from '@/util';
import getUserQuery, {
  type QueryFields,
  type UserQueryParams,
} from './getUserQuery';

export { default as getUserQuery } from './getUserQuery';
export * from './getUserQuery';

type BaseUser = Resources['User'];
type QueriedUser = Resources['QueriedUser'];

export async function getUserList<T extends UserQueryParams>(
  query: OneProperty<QueryFields>,
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

export async function findMissing<
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

export async function getMissingIDErrors(
  missingIDs: { id: BaseUser['id'] }[],
): Promise<ResponseError<typeof errorIDs.User.UserNotFound, { id: string }>[]> {
  return missingIDs.map(
    (data) =>
      ({
        ...errorIDs.User.UserNotFound,
        data,
      }) as const,
  );
}

export const generateId = (() => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const alphabet = `0123456789${letters}${letters.toUpperCase()}`;
  return customAlphabet(alphabet, 8).bind(null, undefined);
})();

export async function generateNewId() {
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

export function generatePasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}
