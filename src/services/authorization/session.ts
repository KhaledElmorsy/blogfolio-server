import { sessions as sessionDB, pool } from '@/db/';
import type { ICreateSessionParams } from '@/db/queries/sessions/sessions.queries';
import ms from 'ms';
import { createSessionID } from './utils';

if (process.env.SESSION_DURATION === undefined) {
  throw new Error('Session duration env variable not defined');
}

export async function checkSession(sessionID: string) {
  const sessions = await sessionDB.getSession.run({ sessionID }, pool);
  if (!sessions.length) return undefined;

  const { user_uid: userID } = sessions[0];
  return userID as string;
}

export async function createSession(
  details: Omit<ICreateSessionParams, 'id' | 'expiryDate'>,
) {
  const sessionID = await createSessionID();
  const sessionData: ICreateSessionParams = {
    ...details,
    id: sessionID,
    expiryDate: new Date(
      Date.now() + ms(process.env.SESSION_DURATION as string),
    ),
  };
  await sessionDB.createSession.run({ ...sessionData }, pool);
  return sessionID;
}

export function getUserSessions(userID: string) {
  return sessionDB.findUserSessions.run({ userID }, pool);
}

export function deleteSession(sessionID: string) {
  return sessionDB.deleteSession.run({ sessionID }, pool);
}

export function deleteAllUserSessions(userID: string) {
  return sessionDB.deleteUserSessions.run({ userID }, pool);
}
