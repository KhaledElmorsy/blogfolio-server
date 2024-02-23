import 'dotenv/config';
import { test, describe, expect, vi, afterEach, beforeEach, it } from 'vitest';
import { session, jwt, COOKIE_KEYS } from '@/services/authorization';
import { users as userDB } from '@/db';
import * as userService from '@/services/user';
import { ErrorCode, SuccessCode } from '@blogfolio/types/Response';
import { errorIDs } from '@blogfolio/types';
import { Login as LoginController } from '..';

const mockExpress = {
  req: {
    useragent: {} as any,
    cookies: { sessionID: 'test' },
  },
  res: {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  },
};

const Login = LoginController.__baseHandlers;

afterEach(() => {
  vi.resetAllMocks();
});

describe('PostLogin', () => {
  test('Username/user doesnt exist. HTTP Error Not Found.', async () => {
    vi.spyOn(userDB.find, 'run').mockResolvedValue([]);
    const response = await Login.PostLogin(
      {
        body: {
          username: 'test',
          password: 'pass',
        },
      },
      mockExpress,
    );
    expect(response.status).toBe(ErrorCode.NotFound);
    if (response.status === ErrorCode.NotFound) {
      expect(response.body.errors[0]).toMatchObject(errorIDs.User.UserNotFound);
    }
  });

  describe('User exists', () => {
    const userID = 'testID';
    beforeEach(() => {
      vi.spyOn(userDB.find, 'run').mockResolvedValue([
        { id: userID, email: 'x', username: 'x' },
      ]);
    });

    test('Password doesnt match: HTTP Error Forbidden', async () => {
      vi.spyOn(userService, 'checkUserPassword').mockResolvedValue(false);
      const response = await Login.PostLogin(
        {
          body: {
            username: 'test',
            password: 'pass',
          },
        },
        mockExpress,
      );
      expect(response.status).toBe(ErrorCode.Forbidden);
    });

    test('Password matches: HTTP Success Ok. Stores session. Gens JWT. Saves cookies', async () => {
      vi.spyOn(userService, 'checkUserPassword').mockResolvedValue(true);
      const sessionID = 'testSession';
      const token = 'jwtoken';

      const sessionSpy = vi
        .spyOn(session, 'createSession')
        .mockResolvedValue(sessionID);
      const jwtSpy = vi.spyOn(jwt, 'generate').mockReturnValue(token);

      const response = await Login.PostLogin(
        {
          body: {
            username: 'test',
            password: 'pass',
          },
        },
        mockExpress,
      );

      const cookieSettings = {
        httpOnly: true,
        secure: true,
      };

      expect(response.status).toBe(SuccessCode.Ok);
      expect(sessionSpy.mock.calls[0][0]).toMatchObject({ userID });
      expect(mockExpress.res.cookie).toHaveBeenCalledWith(
        COOKIE_KEYS.session,
        sessionID,
        cookieSettings,
      );

      expect(jwtSpy).toHaveBeenCalledWith({ userID });
      expect(mockExpress.res.cookie).toHaveBeenCalledWith(
        COOKIE_KEYS.jwt,
        token,
        cookieSettings,
      );
    });
  });
});

describe('PostLogout', () => {
  it('Returns HTTP Success OK. Deletes session if one exists and clear cookies', async () => {
    const sessionDeletSpy = vi
      .spyOn(session, 'deleteSession')
      .mockImplementation(async () => []);

    const sessionCookie = mockExpress.req.cookies.sessionID;
    const response = await Login.PostLogout({}, mockExpress);

    expect(sessionDeletSpy).toHaveBeenCalledWith(sessionCookie);
    expect(mockExpress.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_KEYS.session,
    );
    expect(mockExpress.res.clearCookie).toHaveBeenCalledWith(COOKIE_KEYS.jwt);
    expect(response.status).toBe(SuccessCode.Ok);
  });
});
