/** Types generated for queries found in "src/db/queries/users/users.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type sort_direction = 'asc' | 'desc';

export type user_fields = 'bio' | 'firstName' | 'followerCount' | 'followingCount' | 'lastName' | 'photoFull' | 'photoSmall';

export type user_sortable = 'firstName' | 'followerCount' | 'followingCount' | 'lastName' | 'username';

export type sort_directionArray = (sort_direction)[];

export type user_fieldsArray = (user_fields)[];

export type user_sortableArray = (user_sortable)[];

/** 'GetUsers' parameters type */
export interface IGetUsersParams {
  fields?: user_fieldsArray | null | void;
  followerId?: string | null | void;
  followsId?: string | null | void;
  id?: string | null | void;
  limit?: number | null | void;
  logQuery?: boolean | null | void;
  nextId?: string | null | void;
  pk?: number | null | void;
  searchAny?: string | null | void;
  searchUsername?: string | null | void;
  sortCols?: user_sortableArray | null | void;
  sortDir?: sort_directionArray | null | void;
}

/** 'GetUsers' return type */
export interface IGetUsersResult {
  bio: string | null;
  firstName: string | null;
  followerCount: number;
  followingCount: number;
  id: string;
  lastName: string | null;
  photoFull: string | null;
  photoSmall: string | null;
  username: string;
}

/** 'GetUsers' query type */
export interface IGetUsersQuery {
  params: IGetUsersParams;
  result: IGetUsersResult;
}

const getUsersIR: any = {"usedParamSet":{"fields":true,"sortCols":true,"sortDir":true,"pk":true,"id":true,"followerId":true,"followsId":true,"searchUsername":true,"searchAny":true,"limit":true,"nextId":true,"logQuery":true},"params":[{"name":"fields","required":false,"transform":{"type":"scalar"},"locs":[{"a":226,"b":232}]},{"name":"sortCols","required":false,"transform":{"type":"scalar"},"locs":[{"a":252,"b":260}]},{"name":"sortDir","required":false,"transform":{"type":"scalar"},"locs":[{"a":279,"b":286}]},{"name":"pk","required":false,"transform":{"type":"scalar"},"locs":[{"a":301,"b":303}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":319,"b":321}]},{"name":"followerId","required":false,"transform":{"type":"scalar"},"locs":[{"a":346,"b":356}]},{"name":"followsId","required":false,"transform":{"type":"scalar"},"locs":[{"a":381,"b":390}]},{"name":"searchUsername","required":false,"transform":{"type":"scalar"},"locs":[{"a":418,"b":432}]},{"name":"searchAny","required":false,"transform":{"type":"scalar"},"locs":[{"a":455,"b":464}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":487,"b":492}]},{"name":"nextId","required":false,"transform":{"type":"scalar"},"locs":[{"a":511,"b":517}]},{"name":"logQuery","required":false,"transform":{"type":"scalar"},"locs":[{"a":537,"b":545}]}],"statement":"SELECT\n  id as \"id!\",\n  username as \"username!\",\n  bio,\n  \"firstName\",\n  \"lastName\",\n  \"photoSmall\",\n  \"photoFull\",\n  \"followerCount\" as \"followerCount!\",\n  \"followingCount\" as \"followingCount!\"\nFROM\n  get_user(\n    fields => :fields,\n    sort_cols => :sortCols,\n    sort_dir => :sortDir,\n    q_id => :pk,\n    q_uid => :id,\n    q_follower_uid => :followerId, \n    q_follows_uid => :followsId,\n    q_search_username => :searchUsername,\n    q_search_any => :searchAny,\n    result_limit => :limit,\n    next_uid => :nextId,\n    log_query => :logQuery\n  )"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   id as "id!",
 *   username as "username!",
 *   bio,
 *   "firstName",
 *   "lastName",
 *   "photoSmall",
 *   "photoFull",
 *   "followerCount" as "followerCount!",
 *   "followingCount" as "followingCount!"
 * FROM
 *   get_user(
 *     fields => :fields,
 *     sort_cols => :sortCols,
 *     sort_dir => :sortDir,
 *     q_id => :pk,
 *     q_uid => :id,
 *     q_follower_uid => :followerId, 
 *     q_follows_uid => :followsId,
 *     q_search_username => :searchUsername,
 *     q_search_any => :searchAny,
 *     result_limit => :limit,
 *     next_uid => :nextId,
 *     log_query => :logQuery
 *   )
 * ```
 */
export const getUsers = new PreparedQuery<IGetUsersParams,IGetUsersResult>(getUsersIR);


/** 'Find' parameters type */
export interface IFindParams {
  emails: readonly (string | null | void)[];
  ids: readonly (string | null | void)[];
  usernames: readonly (string | null | void)[];
}

/** 'Find' return type */
export interface IFindResult {
  email: string;
  id: string;
  username: string;
}

/** 'Find' query type */
export interface IFindQuery {
  params: IFindParams;
  result: IFindResult;
}

const findIR: any = {"usedParamSet":{"ids":true,"emails":true,"usernames":true},"params":[{"name":"ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":108,"b":111}]},{"name":"emails","required":false,"transform":{"type":"array_spread"},"locs":[{"a":127,"b":133}]},{"name":"usernames","required":false,"transform":{"type":"array_spread"},"locs":[{"a":152,"b":161}]}],"statement":"SELECT \n  user_uid as \"id!\",\n  email as \"email!\",\n  username as \"username!\"\nFROM users \nWHERE\n  user_uid in :ids\n  OR email in :emails\n  OR username in :usernames"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   user_uid as "id!",
 *   email as "email!",
 *   username as "username!"
 * FROM users 
 * WHERE
 *   user_uid in :ids
 *   OR email in :emails
 *   OR username in :usernames
 * ```
 */
export const find = new PreparedQuery<IFindParams,IFindResult>(findIR);


/** 'GetPassword' parameters type */
export interface IGetPasswordParams {
  id?: string | null | void;
}

/** 'GetPassword' return type */
export interface IGetPasswordResult {
  password: string;
}

/** 'GetPassword' query type */
export interface IGetPasswordQuery {
  params: IGetPasswordParams;
  result: IGetPasswordResult;
}

const getPasswordIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":44,"b":46}]}],"statement":"SELECT password from users WHERE user_uid = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT password from users WHERE user_uid = :id
 * ```
 */
export const getPassword = new PreparedQuery<IGetPasswordParams,IGetPasswordResult>(getPasswordIR);


/** 'GetPks' parameters type */
export interface IGetPksParams {
  ids: readonly (string | null | void)[];
}

/** 'GetPks' return type */
export interface IGetPksResult {
  id: string;
  pk: number;
}

/** 'GetPks' query type */
export interface IGetPksQuery {
  params: IGetPksParams;
  result: IGetPksResult;
}

const getPksIR: any = {"usedParamSet":{"ids":true},"params":[{"name":"ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":72,"b":75}]}],"statement":"SELECT user_uid as \"id!\", user_id as \"pk!\" from users where user_uid in :ids"};

/**
 * Query generated from SQL:
 * ```
 * SELECT user_uid as "id!", user_id as "pk!" from users where user_uid in :ids
 * ```
 */
export const getPks = new PreparedQuery<IGetPksParams,IGetPksResult>(getPksIR);


/** 'GetIds' parameters type */
export interface IGetIdsParams {
  pks: readonly (number | null | void)[];
}

/** 'GetIds' return type */
export interface IGetIdsResult {
  id: string;
  pk: number;
}

/** 'GetIds' query type */
export interface IGetIdsQuery {
  params: IGetIdsParams;
  result: IGetIdsResult;
}

const getIdsIR: any = {"usedParamSet":{"pks":true},"params":[{"name":"pks","required":false,"transform":{"type":"array_spread"},"locs":[{"a":71,"b":74}]}],"statement":"SELECT user_uid as \"id!\", user_id AS \"pk!\" FROM users WHERE user_id in :pks"};

/**
 * Query generated from SQL:
 * ```
 * SELECT user_uid as "id!", user_id AS "pk!" FROM users WHERE user_id in :pks
 * ```
 */
export const getIds = new PreparedQuery<IGetIdsParams,IGetIdsResult>(getIdsIR);


/** 'Add' parameters type */
export interface IAddParams {
  bio?: string | null | void;
  email: string;
  firstName?: string | null | void;
  id: string;
  lastName?: string | null | void;
  password: string;
  photoFull?: string | null | void;
  photoSmall?: string | null | void;
  username: string;
}

/** 'Add' return type */
export type IAddResult = void;

/** 'Add' query type */
export interface IAddQuery {
  params: IAddParams;
  result: IAddResult;
}

const addIR: any = {"usedParamSet":{"id":true,"username":true,"password":true,"email":true,"bio":true,"firstName":true,"lastName":true,"photoSmall":true,"photoFull":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":140,"b":143}]},{"name":"username","required":true,"transform":{"type":"scalar"},"locs":[{"a":148,"b":157}]},{"name":"password","required":true,"transform":{"type":"scalar"},"locs":[{"a":162,"b":171}]},{"name":"email","required":true,"transform":{"type":"scalar"},"locs":[{"a":176,"b":182}]},{"name":"bio","required":false,"transform":{"type":"scalar"},"locs":[{"a":187,"b":190}]},{"name":"firstName","required":false,"transform":{"type":"scalar"},"locs":[{"a":195,"b":204}]},{"name":"lastName","required":false,"transform":{"type":"scalar"},"locs":[{"a":209,"b":217}]},{"name":"photoSmall","required":false,"transform":{"type":"scalar"},"locs":[{"a":222,"b":232}]},{"name":"photoFull","required":false,"transform":{"type":"scalar"},"locs":[{"a":237,"b":246}]}],"statement":"INSERT INTO users (\n  user_uid,\n  username,\n  password,\n  email,\n  bio,\n  first_name,\n  last_name,\n  photo_small,\n  photo_full\n) VALUES (\n  :id!,\n  :username!,\n  :password!,\n  :email!,\n  :bio,\n  :firstName,\n  :lastName,\n  :photoSmall,\n  :photoFull\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (
 *   user_uid,
 *   username,
 *   password,
 *   email,
 *   bio,
 *   first_name,
 *   last_name,
 *   photo_small,
 *   photo_full
 * ) VALUES (
 *   :id!,
 *   :username!,
 *   :password!,
 *   :email!,
 *   :bio,
 *   :firstName,
 *   :lastName,
 *   :photoSmall,
 *   :photoFull
 * )
 * ```
 */
export const add = new PreparedQuery<IAddParams,IAddResult>(addIR);


/** 'Update' parameters type */
export interface IUpdateParams {
  bio?: string | null | void;
  email?: string | null | void;
  firstName?: string | null | void;
  id: string;
  lastName?: string | null | void;
  password?: string | null | void;
  photoFull?: string | null | void;
  photoSmall?: string | null | void;
  username?: string | null | void;
}

/** 'Update' return type */
export type IUpdateResult = void;

/** 'Update' query type */
export interface IUpdateQuery {
  params: IUpdateParams;
  result: IUpdateResult;
}

const updateIR: any = {"usedParamSet":{"username":true,"password":true,"email":true,"bio":true,"firstName":true,"lastName":true,"photoSmall":true,"photoFull":true,"id":true},"params":[{"name":"username","required":false,"transform":{"type":"scalar"},"locs":[{"a":41,"b":49}]},{"name":"password","required":false,"transform":{"type":"scalar"},"locs":[{"a":85,"b":93}]},{"name":"email","required":false,"transform":{"type":"scalar"},"locs":[{"a":127,"b":132}]},{"name":"bio","required":false,"transform":{"type":"scalar"},"locs":[{"a":161,"b":164}]},{"name":"firstName","required":false,"transform":{"type":"scalar"},"locs":[{"a":198,"b":207}]},{"name":"lastName","required":false,"transform":{"type":"scalar"},"locs":[{"a":247,"b":255}]},{"name":"photoSmall","required":false,"transform":{"type":"scalar"},"locs":[{"a":296,"b":306}]},{"name":"photoFull","required":false,"transform":{"type":"scalar"},"locs":[{"a":348,"b":357}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":389,"b":392}]}],"statement":"UPDATE users \nSET \n  username = COALESCE(:username, username),\n  password = COALESCE(:password, password), \n  email = COALESCE(:email, email), \n  bio = COALESCE(:bio, bio), \n  first_name = COALESCE(:firstName, first_name), \n  last_name = COALESCE(:lastName, last_name), \n  photo_small = COALESCE(:photoSmall, photo_small), \n  photo_full = COALESCE(:photoFull, photo_full)\nWHERE user_uid = :id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users 
 * SET 
 *   username = COALESCE(:username, username),
 *   password = COALESCE(:password, password), 
 *   email = COALESCE(:email, email), 
 *   bio = COALESCE(:bio, bio), 
 *   first_name = COALESCE(:firstName, first_name), 
 *   last_name = COALESCE(:lastName, last_name), 
 *   photo_small = COALESCE(:photoSmall, photo_small), 
 *   photo_full = COALESCE(:photoFull, photo_full)
 * WHERE user_uid = :id!
 * ```
 */
export const update = new PreparedQuery<IUpdateParams,IUpdateResult>(updateIR);


/** 'Drop' parameters type */
export interface IDropParams {
  ids: readonly (string | null | void)[];
  pks: readonly (number | null | void)[];
}

/** 'Drop' return type */
export interface IDropResult {
  id: string;
  pk: number;
}

/** 'Drop' query type */
export interface IDropQuery {
  params: IDropParams;
  result: IDropResult;
}

const dropIR: any = {"usedParamSet":{"pks":true,"ids":true},"params":[{"name":"pks","required":false,"transform":{"type":"array_spread"},"locs":[{"a":35,"b":38}]},{"name":"ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":55,"b":58}]}],"statement":"DELETE FROM users WHERE user_id in :pks OR user_uid in :ids\nRETURNING user_uid as \"id!\", user_id as \"pk!\""};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM users WHERE user_id in :pks OR user_uid in :ids
 * RETURNING user_uid as "id!", user_id as "pk!"
 * ```
 */
export const drop = new PreparedQuery<IDropParams,IDropResult>(dropIR);


/** 'CheckFollow' parameters type */
export interface ICheckFollowParams {
  followerId?: string | null | void;
  id?: string | null | void;
}

/** 'CheckFollow' return type */
export interface ICheckFollowResult {
  doesFollow: boolean;
}

/** 'CheckFollow' query type */
export interface ICheckFollowQuery {
  params: ICheckFollowParams;
  result: ICheckFollowResult;
}

const checkFollowIR: any = {"usedParamSet":{"id":true,"followerId":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":122,"b":124}]},{"name":"followerId","required":false,"transform":{"type":"scalar"},"locs":[{"a":193,"b":203}]}],"statement":"WITH found_follow as (\n  SELECT user_id\n  FROM user_follows\n  WHERE user_id = (SELECT user_id FROM users where user_uid = :id)\n    AND follower_id = (SELECT user_id from users where user_uid = :followerId)\n) SELECT (SELECT user_id FROM found_follow) IS NOT NULL as \"doesFollow!\""};

/**
 * Query generated from SQL:
 * ```
 * WITH found_follow as (
 *   SELECT user_id
 *   FROM user_follows
 *   WHERE user_id = (SELECT user_id FROM users where user_uid = :id)
 *     AND follower_id = (SELECT user_id from users where user_uid = :followerId)
 * ) SELECT (SELECT user_id FROM found_follow) IS NOT NULL as "doesFollow!"
 * ```
 */
export const checkFollow = new PreparedQuery<ICheckFollowParams,ICheckFollowResult>(checkFollowIR);


/** 'AddFollow' parameters type */
export interface IAddFollowParams {
  followerId: string;
  id: string;
}

/** 'AddFollow' return type */
export type IAddFollowResult = void;

/** 'AddFollow' query type */
export interface IAddFollowQuery {
  params: IAddFollowParams;
  result: IAddFollowResult;
}

const addFollowIR: any = {"usedParamSet":{"id":true,"followerId":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":103,"b":106}]},{"name":"followerId","required":true,"transform":{"type":"scalar"},"locs":[{"a":156,"b":167}]}],"statement":"INSERT INTO user_follows (user_id, follower_id)\nVALUES (\n  (SELECT user_id FROM users WHERE user_uid = :id!),\n  (SELECT user_id FROM users WHERE user_uid = :followerId!)\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_follows (user_id, follower_id)
 * VALUES (
 *   (SELECT user_id FROM users WHERE user_uid = :id!),
 *   (SELECT user_id FROM users WHERE user_uid = :followerId!)
 * )
 * ```
 */
export const addFollow = new PreparedQuery<IAddFollowParams,IAddFollowResult>(addFollowIR);


/** 'RemoveFollow' parameters type */
export interface IRemoveFollowParams {
  followerId: string;
  id: string;
}

/** 'RemoveFollow' return type */
export type IRemoveFollowResult = void;

/** 'RemoveFollow' query type */
export interface IRemoveFollowQuery {
  params: IRemoveFollowParams;
  result: IRemoveFollowResult;
}

const removeFollowIR: any = {"usedParamSet":{"followerId":true,"id":true},"params":[{"name":"followerId","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":100}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":163,"b":166}]}],"statement":"DELETE FROM user_follows\nWHERE follower_id = (SELECT user_id FROM users WHERE user_uid = :followerId!)\n  AND user_id = (SELECT user_id FROM users WHERE user_uid = :id!)"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM user_follows
 * WHERE follower_id = (SELECT user_id FROM users WHERE user_uid = :followerId!)
 *   AND user_id = (SELECT user_id FROM users WHERE user_uid = :id!)
 * ```
 */
export const removeFollow = new PreparedQuery<IRemoveFollowParams,IRemoveFollowResult>(removeFollowIR);


/** 'CheckActive' parameters type */
export interface ICheckActiveParams {
  id: string;
}

/** 'CheckActive' return type */
export interface ICheckActiveResult {
  active: boolean | null;
}

/** 'CheckActive' query type */
export interface ICheckActiveQuery {
  params: ICheckActiveParams;
  result: ICheckActiveResult;
}

const checkActiveIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":42,"b":45}]}],"statement":"SELECT active FROM users WHERE user_uid = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT active FROM users WHERE user_uid = :id!
 * ```
 */
export const checkActive = new PreparedQuery<ICheckActiveParams,ICheckActiveResult>(checkActiveIR);


/** 'Activate' parameters type */
export interface IActivateParams {
  id: string;
}

/** 'Activate' return type */
export type IActivateResult = void;

/** 'Activate' query type */
export interface IActivateQuery {
  params: IActivateParams;
  result: IActivateResult;
}

const activateIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":53}]}],"statement":"UPDATE users \nSET active = true \nWHERE user_uid = :id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users 
 * SET active = true 
 * WHERE user_uid = :id!
 * ```
 */
export const activate = new PreparedQuery<IActivateParams,IActivateResult>(activateIR);


