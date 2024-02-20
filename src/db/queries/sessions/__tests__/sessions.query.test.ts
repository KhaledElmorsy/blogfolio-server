import { generateDBInserts } from '@/db/test-utils';
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  it,
  expect,
  describe,
} from 'vitest';
import pool from '@/db/pool';
import type { PoolClient } from 'pg';
import testData from '@/db/test-utils/test-data.json';
import { omit, pick } from '@/util';
import * as sessionDB from '../sessions.queries';
import type { ICreateSessionParams } from '../sessions.queries';

beforeAll(async () => {
  const dbInsertQuery = generateDBInserts(
    testData,
    ['users', 'login_sessions'],
    { users: { user_id: true } },
  );
  await pool.query(dbInsertQuery);
});

const sessionData = testData.login_sessions.map((session) => ({
  ...session,
  created_at: new Date(session.created_at),
  expires_at: new Date(session.expires_at),
}));

let client: PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK;');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe('findUserSessions', () => {
  it('Returns all sessions for a specific user ID', async () => {
    const userID = sessionData[0].user_uid;
    const dBSessions = await sessionDB.findUserSessions.run({ userID }, client);
    const actualSessions = sessionData
      .filter(({ user_uid }) => user_uid === userID)
      .map((session) => omit(session, ['user_uid']));
    expect(dBSessions).toEqual(actualSessions);
  });
  it('Returns an empty array if the user ID doesnt exist', async () => {
    const dbSessions = await sessionDB.findUserSessions.run(
      { userID: 'hopefullyThisDoesntExist' },
      client,
    );
    expect(dbSessions).toEqual([]);
  });
});

describe('getSession', () => {
  it('Returns a sessions userID and expiry date if found', async () => {
    const testSession = sessionData[0];
    const sessionID = testSession.session_id;
    const dbSession = await sessionDB.getSession.run({ sessionID }, client);
    expect(dbSession.length).toBe(1);
    expect(dbSession[0]).toEqual(pick(testSession, ['expires_at', 'user_uid']));
  });
  it('Returns an empty array if not found', async () => {
    const sessions = await sessionDB.getSession.run(
      { sessionID: 'nope' },
      client,
    );
    expect(sessions).toEqual([]);
  });
});

describe('deleteUserSessions', () => {
  it('Deletes all sessions for a specific user ID', async () => {
    const userID = testData.users[0].user_uid;
    expect(
      testData.users.filter(({ user_uid }) => user_uid === userID).length,
    ).toBeGreaterThan(0);

    await sessionDB.deleteUserSessions.run({ userID }, client);

    const dbUserSessions = await client.query(
      'SELECT * FROM login_sessions WHERE user_uid = $1;',
      [userID],
    );

    expect(dbUserSessions.rowCount).toBe(0);
  });
});

describe('deleteSession', () => {
  it('Deletes the session with a given session ID', async () => {
    async function getSession(id: string) {
      return client.query(
        'SELECT * FROM login_sessions WHERE session_id = $1;',
        [id],
      );
    }
    const sessionID = sessionData[0].session_id;

    const sessionPreDelete = await getSession(sessionID);
    expect(sessionPreDelete.rowCount).toBe(1);

    await sessionDB.deleteSession.run({ sessionID }, client);

    const sessionPostDelete = await getSession(sessionID);
    expect(sessionPostDelete.rowCount).toBe(0);
  });
});

describe('deleteExpiredSessions', () => {
  it('Deletes all sessions with expiry dates before the input date', async () => {
    const sortedSessionExp = sessionData
      .slice()
      .sort(
        (a, b) => b.expires_at.getUTCSeconds() - a.expires_at.getUTCSeconds(),
      );
    const sessionCount = sortedSessionExp.length;
    const semiMedianExpiry = sortedSessionExp[Math.floor(sessionCount / 2)].expires_at;

    const preDeleteExpired = sessionData.filter(
      ({ expires_at }) => expires_at < semiMedianExpiry,
    );

    expect(preDeleteExpired.length).toBeGreaterThan(0);

    await sessionDB.deleteExpiredSessions.run(
      { date: semiMedianExpiry },
      client,
    );

    const remainingExpired = await client.query(
      `
    SELECT * FROM login_sessions WHERE expires_at < $1::timestamptz;
    `,
      [semiMedianExpiry.toISOString()],
    );
    expect(remainingExpired.rowCount).toBe(0);
  });
});

describe('createSession', () => {
  const newSession: ICreateSessionParams = {
    id: 'testID',
    userID: testData.users[2].user_uid,
    browser: 'chrome',
    platform: 'desktop',
    expiryDate: new Date(Date.now() + 10 * 60 * 60 * 24 * 1000),
  };
  it('Adds a session with the passed info to the table', async () => {
    const sessionAlreadyExists = sessionData.find(
      ({ session_id }) => session_id === newSession.id,
    );
    expect(sessionAlreadyExists).toBeFalsy();
    await sessionDB.createSession.run({ ...newSession }, client);
    const newSessionDB = await client.query(
      'SELECT * FROM login_sessions WHERE session_id = $1;',
      [newSession.id],
    );
    expect(newSessionDB.rowCount).toBe(1);
    const s = newSession;
    expect(newSessionDB.rows[0]).toMatchObject({
      session_id: s.id,
      user_uid: s.userID,
      session_platform: s.platform,
      session_browser: s.browser,
      expires_at: s.expiryDate,
    });
  });
  it('Throws if the session ID already exists', async () => {
    const existingSessionID = sessionData[0].session_id;
    const creationAttempt = async () =>
      sessionDB.createSession.run(
        { ...newSession, id: existingSessionID },
        client,
      );
    expect(creationAttempt).rejects.toThrow();
  });
});
