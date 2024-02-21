import { sessions as sessionDB, pool } from '@/db/';
import { nanoid } from 'nanoid';

export default async function createSessionID() {
  let sessionID;
  let idExists;
  do {
    sessionID = nanoid();
    idExists = (await sessionDB.getSession.run({ sessionID }, pool)).length;
  } while (idExists);
  return sessionID;
}
