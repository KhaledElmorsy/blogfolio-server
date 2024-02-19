import bcrypt from 'bcrypt';
import { endPoints } from '@blogfolio/types/User';
import { pool, users as userDB } from '@/db';
import { createController } from '@/controllers/util';
import {
  findMissing,
  generateNewId,
  generatePasswordHash,
  getMissingIDErrors,
  getUserList,
} from './util';

const DEFAULT_USER_LIST_SIZE_GENERAL = 20;

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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id, followerId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id, followerId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
    const missingIDs = await findMissing({ id: [id, followerId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
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
