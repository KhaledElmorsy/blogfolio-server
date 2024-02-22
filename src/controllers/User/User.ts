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
} from '@/services/user';

const DEFAULT_USER_LIST_SIZE_GENERAL = 20;

export default createController('User', endPoints, (errors) => ({
  async Get(
    { params: { id }, query: { fields } },
    { codes, createResponse, createError },
  ) {
    const [user] = await getUserList({ id }, { fields });
    if (user) {
      return createResponse(codes.success.Ok, { data: { user } });
    }
    return createResponse(codes.error.NotFound, {
      errors: [createError(errors.User.UserNotFound, { id })],
    });
  },

  async GetFollowers({ params: { id }, query }, { codes, createResponse }) {
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }

    const followers = await getUserList(
      { followerId: id },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );

    return createResponse(codes.success.Ok, { data: { users: followers } });
  },

  async GetFollows({ params: { id }, query }, { codes, createResponse }) {
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }

    const follows = await getUserList(
      { followsId: id },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );

    return createResponse(codes.success.Ok, { data: { users: follows } });
  },

  async GetExistsEmail({ params: { email } }, { codes, createResponse }) {
    const emailExists = (await findMissing({ email: [email] })).length === 0;
    return createResponse(codes.success.Ok, { data: { result: emailExists } });
  },

  async GetExistsUsername({ params: { username } }, { codes, createResponse }) {
    const usernameExists = (await findMissing({ username: [username] })).length === 0;
    return createResponse(codes.success.Ok, {
      data: { result: usernameExists },
    });
  },

  async GetSearchUsername(
    { params: { username }, query },
    { codes, createResponse },
  ) {
    const users = await getUserList(
      { searchUsername: username },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );
    return createResponse(codes.success.Ok, { data: { users } });
  },

  async GetSearchAny({ params: { text }, query }, { codes, createResponse }) {
    const users = await getUserList(
      { searchAny: text },
      { limit: DEFAULT_USER_LIST_SIZE_GENERAL, ...query },
    );
    return createResponse(codes.success.Ok, { data: { users } });
  },

  async GetCheckFollow(
    { params: { followerId, id } },
    { codes, createResponse },
  ) {
    const missingIDs = await findMissing({ id: [id, followerId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }

    const [{ doesFollow }] = await userDB.checkFollow.run(
      { followerId, id },
      pool,
    );
    return createResponse(codes.success.Ok, { data: { result: doesFollow } });
  },

  async Post({ body }, { codes, createResponse, createError }) {
    const { email, username, password } = body;

    const [emailExists, usernameExists] = (
      await Promise.all([
        findMissing({ email: [email] }),
        findMissing({ username: [username] }),
      ])
    ).map((missingVals) => !missingVals.length);

    if (emailExists || usernameExists) {
      return createResponse(codes.error.Conflict, {
        errors: [
          ...(emailExists
            ? [createError(errors.User.EmailExists, { email })]
            : []),
          ...(usernameExists
            ? [createError(errors.User.UsernameExists, { username })]
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
    return createResponse(codes.success.Created, { data: { id } });
  },

  async Put({ body }, { codes, createResponse }, { res }) {
    const { userID: id } = res.locals;
    await userDB.update.run({ id, ...body }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async PutEmail(
    { body: { email } },
    { codes, createResponse, createError },
    { res },
  ) {
    const { userID: id } = res.locals;
    const emailExists = !(await findMissing({ email: [email] })).length;
    if (emailExists) {
      return createResponse(codes.error.Conflict, {
        errors: [createError(errors.User.EmailExists, { email })],
      });
    }
    await userDB.update.run({ id, email }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async PutPassword(
    { body: { password } },
    { codes, createResponse, createError },
    { res },
  ) {
    const { userID: id } = res.locals;
    const [{ password: oldPassHash }] = await userDB.getPassword.run(
      { id },
      pool,
    );
    const samePass = await bcrypt.compare(password, oldPassHash);
    if (samePass) {
      return createResponse(codes.error.Conflict, {
        errors: [createError(errors.User.SamePassword)],
      });
    }
    await userDB.update.run({ id, password }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async PutFollower(
    { params: { targetId } },
    { codes, createResponse, createError },
    { res },
  ) {
    const { userID: id } = res.locals;

    const missingIDs = await findMissing({ id: [id, targetId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }

    const [{ doesFollow }] = await userDB.checkFollow.run(
      { id: targetId, followerId: id },
      pool,
    );

    if (doesFollow) {
      return createResponse(codes.error.Conflict, {
        errors: [
          createError(errors.User.AlreadyFollowing, {
            follower: { id },
            target: { id: targetId },
          }),
        ],
      });
    }
    await userDB.addFollow.run({ followerId: id, id: targetId }, pool);
    return createResponse(codes.success.Ok, {
      data: { follower: { id }, target: { id: targetId } },
    });
  },

  async PutActivate(
    { params: { id } },
    { codes, createResponse, createError },
  ) {
    const missingIDs = await findMissing({ id: [id] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }
    const [{ active: isActive }] = await userDB.checkActive.run({ id }, pool);
    if (isActive) {
      return createResponse(codes.error.Conflict, {
        errors: [createError(errors.User.AlreadyActivated, { id })],
      });
    }
    await userDB.activate.run({ id }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async PutUsername(
    { body: { username } },
    { codes, createResponse, createError },
    { res },
  ) {
    const { userID: id } = res.locals;
    const usernameExists = !(await findMissing({ username: [username] }))
      .length;
    if (usernameExists) {
      return createResponse(codes.error.Conflict, {
        errors: [createError(errors.User.UsernameExists, { username })],
      });
    }
    await userDB.update.run({ id, username }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async Delete(_req, { codes, createResponse }, { res }) {
    const { userID: id } = res.locals;
    await userDB.drop.run({ ids: [id], pks: [null] }, pool);
    return createResponse(codes.success.Ok, { data: { id } });
  },

  async DeleteFollow(
    { params: { targetId } },
    { codes, createResponse, createError },
    { res },
  ) {
    const { userID: id } = res.locals;

    const missingIDs = await findMissing({ id: [id, targetId] });
    const missingIDErrors = await getMissingIDErrors(missingIDs);
    if (missingIDErrors.length) {
      return createResponse(codes.error.NotFound, { errors: missingIDErrors });
    }

    const [{ doesFollow }] = await userDB.checkFollow.run(
      { id: targetId, followerId: id },
      pool,
    );
    if (!doesFollow) {
      return createResponse(codes.error.Conflict, {
        errors: [
          createError(errors.User.NotFollowing, {
            follower: { id },
            target: { id: targetId },
          }),
        ],
      });
    }

    await userDB.removeFollow.run({ followerId: id, id: targetId }, pool);
    return createResponse(codes.success.Ok, {
      data: { follower: { id }, target: { id: targetId } },
    });
  },
}));
