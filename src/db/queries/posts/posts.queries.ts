/** Types generated for queries found in "src/db/queries/posts/posts.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'Find' parameters type */
export interface IFindParams {
  createdAter?: Date | string | null | void;
  createdBefore?: Date | string | null | void;
  id?: string | null | void;
  user__id?: number | null | void;
  userId?: string | null | void;
  visible?: boolean | null | void;
}

/** 'Find' return type */
export interface IFindResult {
  author: string | null;
  body: Json;
  createdAt: Date | null;
  editedAt: Date | null;
  id: string;
  slug: string | null;
  summary: string | null;
  title: string;
  views: number;
}

/** 'Find' query type */
export interface IFindQuery {
  params: IFindParams;
  result: IFindResult;
}

const findIR: any = {"usedParamSet":{"userId":true,"id":true,"visible":true,"user__id":true,"createdBefore":true,"createdAter":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":63,"b":69},{"a":430,"b":436}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":333,"b":335},{"a":340,"b":342}]},{"name":"visible","required":false,"transform":{"type":"scalar"},"locs":[{"a":370,"b":377},{"a":382,"b":389}]},{"name":"user__id","required":false,"transform":{"type":"scalar"},"locs":[{"a":466,"b":474},{"a":479,"b":487}]},{"name":"createdBefore","required":false,"transform":{"type":"scalar"},"locs":[{"a":518,"b":531},{"a":536,"b":549}]},{"name":"createdAter","required":false,"transform":{"type":"scalar"},"locs":[{"a":580,"b":591},{"a":596,"b":607}]}],"statement":"WITH \n  user_id AS (SELECT user_id FROM users WHERE user_uid = :userId)\nSELECT \n  post_uid as id,\n  post_slug as slug,\n  (select user_uid from users u where u.user_id = p.user_id) as \"author\",\n  title,\n  summary,\n  body,\n  num_views as \"views\",\n  created_at as \"createdAt\",\n  edited_at as \"editedAt\"\nFROM posts p\nWHERE\n  (post_uid = :id OR :id IS NULL)\n  AND (visible = :visible OR :visible IS NULL)\n  AND (p.user_id = user_id OR :userId IS NULL)\n  AND (p.user_id = :user__id or :user__id IS NULL)\n  AND (created_at < :createdBefore OR :createdBefore IS NULL)\n  AND (created_at > :createdAter OR :createdAter IS NULL)"};

/**
 * Query generated from SQL:
 * ```
 * WITH 
 *   user_id AS (SELECT user_id FROM users WHERE user_uid = :userId)
 * SELECT 
 *   post_uid as id,
 *   post_slug as slug,
 *   (select user_uid from users u where u.user_id = p.user_id) as "author",
 *   title,
 *   summary,
 *   body,
 *   num_views as "views",
 *   created_at as "createdAt",
 *   edited_at as "editedAt"
 * FROM posts p
 * WHERE
 *   (post_uid = :id OR :id IS NULL)
 *   AND (visible = :visible OR :visible IS NULL)
 *   AND (p.user_id = user_id OR :userId IS NULL)
 *   AND (p.user_id = :user__id or :user__id IS NULL)
 *   AND (created_at < :createdBefore OR :createdBefore IS NULL)
 *   AND (created_at > :createdAter OR :createdAter IS NULL)
 * ```
 */
export const find = new PreparedQuery<IFindParams,IFindResult>(findIR);


/** 'GetId' parameters type */
export interface IGetIdParams {
  id?: string | null | void;
}

/** 'GetId' return type */
export interface IGetIdResult {
  __id: number;
}

/** 'GetId' query type */
export interface IGetIdQuery {
  params: IGetIdParams;
  result: IGetIdResult;
}

const getIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":53,"b":55}]}],"statement":"SELECT post_id as \"__id\" from posts WHERE post_uid = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT post_id as "__id" from posts WHERE post_uid = :id
 * ```
 */
export const getId = new PreparedQuery<IGetIdParams,IGetIdResult>(getIdIR);


/** 'Insert' parameters type */
export interface IInsertParams {
  body: Json;
  postId: string;
  slug?: string | null | void;
  summary?: string | null | void;
  title: string;
  userId: number;
}

/** 'Insert' return type */
export type IInsertResult = void;

/** 'Insert' query type */
export interface IInsertQuery {
  params: IInsertParams;
  result: IInsertResult;
}

const insertIR: any = {"usedParamSet":{"userId":true,"postId":true,"slug":true,"title":true,"summary":true,"body":true},"params":[{"name":"userId","required":true,"transform":{"type":"scalar"},"locs":[{"a":96,"b":103}]},{"name":"postId","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":115}]},{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":124}]},{"name":"title","required":true,"transform":{"type":"scalar"},"locs":[{"a":129,"b":135}]},{"name":"summary","required":false,"transform":{"type":"scalar"},"locs":[{"a":140,"b":147}]},{"name":"body","required":true,"transform":{"type":"scalar"},"locs":[{"a":152,"b":157}]}],"statement":"INSERT INTO posts (\n  user_id,\n  post_uid,\n  post_slug,\n  title,\n  summary,\n  body\n) VALUES (\n  :userId!,\n  :postId!,\n  :slug,\n  :title!,\n  :summary,\n  :body!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO posts (
 *   user_id,
 *   post_uid,
 *   post_slug,
 *   title,
 *   summary,
 *   body
 * ) VALUES (
 *   :userId!,
 *   :postId!,
 *   :slug,
 *   :title!,
 *   :summary,
 *   :body!
 * )
 * ```
 */
export const insert = new PreparedQuery<IInsertParams,IInsertResult>(insertIR);


/** 'Update' parameters type */
export interface IUpdateParams {
  body?: Json | null | void;
  id?: number | null | void;
  slug?: string | null | void;
  summary?: string | null | void;
  title?: string | null | void;
  visible?: boolean | null | void;
}

/** 'Update' return type */
export type IUpdateResult = void;

/** 'Update' query type */
export interface IUpdateQuery {
  params: IUpdateParams;
  result: IUpdateResult;
}

const updateIR: any = {"usedParamSet":{"slug":true,"title":true,"summary":true,"body":true,"visible":true,"id":true},"params":[{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":40,"b":44}]},{"name":"title","required":false,"transform":{"type":"scalar"},"locs":[{"a":78,"b":83}]},{"name":"summary","required":false,"transform":{"type":"scalar"},"locs":[{"a":115,"b":122}]},{"name":"body","required":false,"transform":{"type":"scalar"},"locs":[{"a":153,"b":157}]},{"name":"visible","required":false,"transform":{"type":"scalar"},"locs":[{"a":188,"b":195}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":223,"b":225}]}],"statement":"UPDATE posts\nSET\n  post_slug = COALESCE(:slug, post_slug),\n  title = COALESCE(:title, title),\n  summary = COALESCE(:summary, summary),\n  body = COALESCE(:body, body),\n  visible = COALESCE(:visible, visible)\nWHERE post_id = :id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE posts
 * SET
 *   post_slug = COALESCE(:slug, post_slug),
 *   title = COALESCE(:title, title),
 *   summary = COALESCE(:summary, summary),
 *   body = COALESCE(:body, body),
 *   visible = COALESCE(:visible, visible)
 * WHERE post_id = :id
 * ```
 */
export const update = new PreparedQuery<IUpdateParams,IUpdateResult>(updateIR);


/** 'Drop' parameters type */
export interface IDropParams {
  __ids: readonly (number | null | void)[];
}

/** 'Drop' return type */
export type IDropResult = void;

/** 'Drop' query type */
export interface IDropQuery {
  params: IDropParams;
  result: IDropResult;
}

const dropIR: any = {"usedParamSet":{"__ids":true},"params":[{"name":"__ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":35,"b":40}]}],"statement":"DELETE FROM posts WHERE post_id IN :__ids"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM posts WHERE post_id IN :__ids
 * ```
 */
export const drop = new PreparedQuery<IDropParams,IDropResult>(dropIR);


