/** Types generated for queries found in "src/db/queries/sessions/sessions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type browser = 'chrome' | 'edge' | 'firefox' | 'opera' | 'safari' | 'unknown';

export type platform = 'desktop' | 'mobile';

/** 'CreateSession' parameters type */
export interface ICreateSessionParams {
  browser: browser;
  expiryDate: Date | string;
  id: string;
  platform: platform;
  userID: string;
}

/** 'CreateSession' return type */
export type ICreateSessionResult = void;

/** 'CreateSession' query type */
export interface ICreateSessionQuery {
  params: ICreateSessionParams;
  result: ICreateSessionResult;
}

const createSessionIR: any = {"usedParamSet":{"id":true,"userID":true,"platform":true,"browser":true,"expiryDate":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":134,"b":137}]},{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":144,"b":151}]},{"name":"platform","required":true,"transform":{"type":"scalar"},"locs":[{"a":158,"b":167}]},{"name":"browser","required":true,"transform":{"type":"scalar"},"locs":[{"a":174,"b":182}]},{"name":"expiryDate","required":true,"transform":{"type":"scalar"},"locs":[{"a":189,"b":200}]}],"statement":"INSERT INTO login_sessions (\n    session_id,\n    user_uid,\n    session_platform,\n    session_browser,\n    expires_at\n  )\nVALUES (\n    :id!,\n    :userID!,\n    :platform!,\n    :browser!,\n    :expiryDate!\n  )"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO login_sessions (
 *     session_id,
 *     user_uid,
 *     session_platform,
 *     session_browser,
 *     expires_at
 *   )
 * VALUES (
 *     :id!,
 *     :userID!,
 *     :platform!,
 *     :browser!,
 *     :expiryDate!
 *   )
 * ```
 */
export const createSession = new PreparedQuery<ICreateSessionParams,ICreateSessionResult>(createSessionIR);


/** 'GetSession' parameters type */
export interface IGetSessionParams {
  sessionID: string;
}

/** 'GetSession' return type */
export interface IGetSessionResult {
  expires_at: Date;
  user_uid: string | null;
}

/** 'GetSession' query type */
export interface IGetSessionQuery {
  params: IGetSessionParams;
  result: IGetSessionResult;
}

const getSessionIR: any = {"usedParamSet":{"sessionID":true},"params":[{"name":"sessionID","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":79}]}],"statement":"SELECT user_uid,\n  expires_at\nFROM login_sessions\nWHERE session_id = :sessionID!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT user_uid,
 *   expires_at
 * FROM login_sessions
 * WHERE session_id = :sessionID!
 * ```
 */
export const getSession = new PreparedQuery<IGetSessionParams,IGetSessionResult>(getSessionIR);


/** 'FindUserSessions' parameters type */
export interface IFindUserSessionsParams {
  userID: string;
}

/** 'FindUserSessions' return type */
export interface IFindUserSessionsResult {
  created_at: Date | null;
  expires_at: Date;
  session_browser: browser;
  session_id: string;
  session_platform: platform;
}

/** 'FindUserSessions' query type */
export interface IFindUserSessionsQuery {
  params: IFindUserSessionsParams;
  result: IFindUserSessionsResult;
}

const findUserSessionsIR: any = {"usedParamSet":{"userID":true},"params":[{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":122,"b":129}]}],"statement":"SELECT session_id,\n  created_at,\n  expires_at,\n  session_platform,\n  session_browser\nFROM login_sessions\nWHERE user_uid = :userID!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT session_id,
 *   created_at,
 *   expires_at,
 *   session_platform,
 *   session_browser
 * FROM login_sessions
 * WHERE user_uid = :userID!
 * ```
 */
export const findUserSessions = new PreparedQuery<IFindUserSessionsParams,IFindUserSessionsResult>(findUserSessionsIR);


/** 'DeleteExpiredSessions' parameters type */
export interface IDeleteExpiredSessionsParams {
  date: Date | string;
}

/** 'DeleteExpiredSessions' return type */
export type IDeleteExpiredSessionsResult = void;

/** 'DeleteExpiredSessions' query type */
export interface IDeleteExpiredSessionsQuery {
  params: IDeleteExpiredSessionsParams;
  result: IDeleteExpiredSessionsResult;
}

const deleteExpiredSessionsIR: any = {"usedParamSet":{"date":true},"params":[{"name":"date","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":51}]}],"statement":"DELETE FROM login_sessions\nWHERE expires_at < :date!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM login_sessions
 * WHERE expires_at < :date!
 * ```
 */
export const deleteExpiredSessions = new PreparedQuery<IDeleteExpiredSessionsParams,IDeleteExpiredSessionsResult>(deleteExpiredSessionsIR);


/** 'DeleteSession' parameters type */
export interface IDeleteSessionParams {
  sessionID: string;
}

/** 'DeleteSession' return type */
export type IDeleteSessionResult = void;

/** 'DeleteSession' query type */
export interface IDeleteSessionQuery {
  params: IDeleteSessionParams;
  result: IDeleteSessionResult;
}

const deleteSessionIR: any = {"usedParamSet":{"sessionID":true},"params":[{"name":"sessionID","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":56}]}],"statement":"DELETE FROM login_sessions\nWHERE session_id = :sessionID!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM login_sessions
 * WHERE session_id = :sessionID!
 * ```
 */
export const deleteSession = new PreparedQuery<IDeleteSessionParams,IDeleteSessionResult>(deleteSessionIR);


/** 'DeleteUserSessions' parameters type */
export interface IDeleteUserSessionsParams {
  userID: string;
}

/** 'DeleteUserSessions' return type */
export type IDeleteUserSessionsResult = void;

/** 'DeleteUserSessions' query type */
export interface IDeleteUserSessionsQuery {
  params: IDeleteUserSessionsParams;
  result: IDeleteUserSessionsResult;
}

const deleteUserSessionsIR: any = {"usedParamSet":{"userID":true},"params":[{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":44,"b":51}]}],"statement":"DELETE FROM login_sessions\nWHERE user_uid = :userID!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM login_sessions
 * WHERE user_uid = :userID!
 * ```
 */
export const deleteUserSessions = new PreparedQuery<IDeleteUserSessionsParams,IDeleteUserSessionsResult>(deleteUserSessionsIR);


