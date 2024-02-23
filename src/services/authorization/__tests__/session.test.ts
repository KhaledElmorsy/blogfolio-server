import 'dotenv/config';
import { describe, expect, afterEach, it, vi } from 'vitest';
import { sessions as sessionDB } from '@/db';
import { ICreateSessionParams } from '@/db/queries/sessions/sessions.queries';
import ms from 'ms';
import { session } from '..';
import * as authUtils from '../utils';

afterEach(() => {
  vi.resetAllMocks();
});

describe('checkSession', () => {
  it('Returns the users ID if the session exists', async () => {
    const userID = 'testID';
    vi.spyOn(sessionDB.getSession, 'run').mockResolvedValue([
      { user_uid: userID, expires_at: new Date() },
    ]);
    const sessionUserID = await session.checkSession('sessID');
    expect(sessionUserID).toBe(userID);
  });
  it('Returns undefined if the session doesnt exist', async () => {
    vi.spyOn(sessionDB.getSession, 'run').mockResolvedValue([]);
    const userID = await session.checkSession('sessID');
    expect(userID).toBe(undefined);
  });
});

describe('createSession', () => {
  it('Generates an ID & expiry date and passes input data to the DB query', async () => {
    const sessionData: Omit<ICreateSessionParams, 'expiryDate' | 'id'> = {
      userID: 'testID',
      browser: 'unknown',
      platform: 'desktop',
    };
    const sessionID = 'testSessionID';
    const mockNowDate = 1000;
    const duration = process.env.SESSION_DURATION ?? '1y';

    vi.spyOn(authUtils, 'createSessionID').mockResolvedValue(sessionID);
    vi.spyOn(Date, 'now').mockReturnValue(mockNowDate);
    const sessionDBSpy = vi
      .spyOn(sessionDB.createSession, 'run')
      .mockImplementation(async () => []);

    const createdSessionID = await session.createSession(sessionData);

    expect(createdSessionID).toBe(sessionID);
    expect(sessionDBSpy.mock.calls[0][0]).toMatchObject({
      ...sessionData,
      id: sessionID,
      expiryDate: new Date(Date.now() + ms(duration)),
    });
  });
});

describe('getUserSessions', () => {
  it('Calls the query with the passed input and returns its results', async () => {
    const mockUserSessions: any[] = [];
    const userID = 'testID';
    const sessionQuerySpy = vi
      .spyOn(sessionDB.findUserSessions, 'run')
      .mockResolvedValue(mockUserSessions);

    const userSessions = await session.getUserSessions(userID);

    expect(sessionQuerySpy.mock.calls[0][0]).toMatchObject({ userID });
    expect(userSessions).toBe(mockUserSessions);
  });
});

describe('deleteSession', () => {
  it('Calls the query with the correct passed args', async () => {
    const sessionID = 'testID';
    const sessionQuerySpy = vi
      .spyOn(sessionDB.deleteSession, 'run')
      .mockImplementation(async () => []);

    await session.deleteSession(sessionID);

    expect(sessionQuerySpy.mock.calls[0][0]).toMatchObject({ sessionID });
  });
});

describe('deleteAllUserSessions', () => {
  it('Calls the query with the correct passed args', async () => {
    const userID = 'testID';
    const sessionQuerySpy = vi
      .spyOn(sessionDB.deleteUserSessions, 'run')
      .mockImplementation(async () => []);

    await session.deleteAllUserSessions(userID);

    expect(sessionQuerySpy.mock.calls[0][0]).toMatchObject({ userID });
  });
});
