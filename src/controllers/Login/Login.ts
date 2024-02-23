import { Login } from '@blogfolio/types';
import { users as userDB, pool } from '@/db';
import { session, jwt, COOKIE_KEYS } from '@/services/authorization';
import { checkUserPassword } from '@/services/user';
import { createController } from '../util';

const controller = createController('Login', Login.endpoints, (errors) => ({
  async PostLogin(
    { body: { username, password } },
    { codes, createResponse, createError },
    { res, req },
  ) {
    const userSearch = await userDB.find.run(
      { usernames: [username], ids: [null], emails: [null] },
      pool,
    );
    const userID = userSearch[0]?.id;
    if (userID === undefined) {
      return createResponse(codes.error.NotFound, {
        errors: [createError(errors.User.UserNotFound)],
      });
    }

    const passIsCorrect = await checkUserPassword(userID, password);
    if (!passIsCorrect) return createResponse(codes.error.Forbidden, { errors: [] });

    const userAgent = req.useragent;
    // TODO Implement browser matching
    const sessionID = await session.createSession({
      userID,
      browser: 'unknown',
      platform: userAgent?.isDesktop ? 'desktop' : 'mobile',
    });
    res.cookie(COOKIE_KEYS.session, sessionID, {
      secure: true,
      httpOnly: true,
    });

    const jwToken = jwt.generate({ userID });
    res.cookie(COOKIE_KEYS.jwt, jwToken, { secure: true, httpOnly: true });

    return createResponse(codes.success.Ok, {});
  },

  async PostLogout(_parsedReq, { codes, createResponse }, { req, res, next }) {
    const { sessionID } = req.cookies;
    if (sessionID) await session.deleteSession(sessionID);

    res.clearCookie(COOKIE_KEYS.jwt);
    res.clearCookie(COOKIE_KEYS.session);
    return createResponse(codes.success.Ok, {});
  },
}));

export default controller;
