import { expect, test, vi, afterEach, describe, beforeEach } from 'vitest';
import { COOKIE_KEYS, jwt, session } from '@/services/authorization';
import { ErrorCode } from '@blogfolio/types/Response';
import type { Response } from 'express';
import * as userService from '@/services/user';
import authorize from '../authorize';

const userID = 'testID';
const sessionID = 'testSessionID';
const token = 'testJWT';

const req = {
  cookies: { userID, sessionID, token },
} as any satisfies Request;

const res = {
  cookie: vi.fn(),
  sendStatus: vi.fn(),
  locals: {},
} as any satisfies Response & { locals: any };

const next = vi.fn();

vi.mock('@/services/authorization', () => ({
  jwt: { verify: vi.fn(), generate: vi.fn() },
  session: { checkSession: vi.fn() },
  COOKIE_KEYS: {
    jwt: 'token',
    session: 'sessionID',
  },
}));

afterEach(() => {
  res.locals = {};
  vi.resetAllMocks();
});

describe('JWT', () => {
  test('JWT authorizes existing user: Authenticate user and  to next middleware', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue(userID);
    vi.spyOn(userService, 'findMissing').mockResolvedValue([]);
    await authorize(req, res, next);
    expect(res.locals.userID).toBe(userID);
    expect(next).toHaveBeenCalled();
  });

  test('JWT fails/expired: Check session ID', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue(undefined);
    await authorize(req, res, next);
    expect(session.checkSession).toHaveBeenCalled();
  });

  test('JWT returns ID of a deleted user: Ignore user ID & check session ID', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue(userID);
    vi.spyOn(userService, 'findMissing').mockResolvedValue([{ id: userID }]);
    await authorize(req, res, next);
    expect(res.locals.userID).not.toBe(userID);
    expect(session.checkSession).toHaveBeenCalled();
  });

  test('No JWT: Check session ID', async () => {
    await authorize({ cookies: { userID, sessionID } } as any, res, next);
    expect(session.checkSession).toHaveBeenCalled();
  });
});

describe('Session', () => {
  beforeEach(() => {
    req.cookies.token = undefined;
  });

  test('Session returns userID: Create new JWT & cookie. Authorize user ID. Continue', async () => {
    vi.spyOn(session, 'checkSession').mockResolvedValue(userID);
    vi.spyOn(jwt, 'generate').mockReturnValue(token);

    await authorize(req, res, next);

    expect(jwt.generate).toHaveBeenCalledWith({ userID });
    expect(res.cookie).toHaveBeenCalledWith(
      COOKIE_KEYS.jwt,
      token,
      expect.anything(),
    );
    expect(next).toHaveBeenCalled();
    expect(res.locals.userID).toBe(userID);
  });

  test('Session not found. Respond with Error Code Unauthorized', async () => {
    vi.spyOn(session, 'checkSession').mockResolvedValue(undefined);
    await authorize(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(ErrorCode.Unauthorized);
  });
});
