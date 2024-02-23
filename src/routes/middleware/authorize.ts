import { COOKIE_KEYS, jwt, session } from '@/services/authorization';
import { ErrorCode } from '@blogfolio/types/Response';
import type { RequestHandler } from 'express';
import { findMissing as findMissingUser } from '@/services/user';

const authorize: RequestHandler = async (req, res, next) => {
  const authorizeUser = (userID: string) => {
    res.locals.userID = userID;
    return next();
  };

  const { sessionID, token } = req.cookies;

  if (token) {
    const jwtUserID = jwt.verify(token);
    if (jwtUserID !== undefined) {
      const userExists = !(await findMissingUser({ id: [jwtUserID] })).length;
      if (userExists) return authorizeUser(jwtUserID);
    }
  }

  if (sessionID) {
    const sessionUserID = await session.checkSession(sessionID);
    if (sessionUserID !== undefined) {
      // Create new short term JWT
      res.cookie(COOKIE_KEYS.jwt, jwt.generate({ userID: sessionUserID }), {
        httpOnly: true,
        secure: true,
      });
      return authorizeUser(sessionUserID);
    }
  }

  return res.sendStatus(ErrorCode.Unauthorized);
};

export default authorize;
