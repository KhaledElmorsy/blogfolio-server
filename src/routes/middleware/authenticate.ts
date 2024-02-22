import { COOKIE_KEYS, jwt, session } from '@/services/authentication';
import { ErrorCode } from '@blogfolio/types/Response';
import type { RequestHandler } from 'express';
import { findMissing as findMissingUser } from '@/services/user';

const authenticate: RequestHandler = async (req, res, next) => {
  const authenticateAndContinue = (userID: string) => {
    res.locals.userID = userID;
    return next();
  };

  const { sessionID, token } = req.cookies;

  if (token) {
    const jwtUserID = jwt.authenticateToken(token);
    if (jwtUserID !== undefined) {
      const userExists = !(await findMissingUser({ id: [jwtUserID] })).length;
      if (userExists) return authenticateAndContinue(jwtUserID);
    }
  }

  if (sessionID) {
    const sessionUserID = await session.checkSession(sessionID);
    if (sessionUserID !== undefined) {
      // Create new short term JWT
      res.cookie(
        COOKIE_KEYS.jwt,
        jwt.generateToken({ userID: sessionUserID }),
        {
          httpOnly: true,
          secure: true,
        },
      );
      return authenticateAndContinue(sessionUserID);
    }
  }

  return res.sendStatus(ErrorCode.Unauthorized);
};

export default authenticate;
