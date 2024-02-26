/** Types generated for queries found in "src/db/queries/posts/posts.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'Find' parameters type */
export interface IFindParams {
  id?: string | null | void;
  limit?: number | null | void;
  nextID?: string | null | void;
  recentFirst?: boolean | null | void;
  search?: string | null | void;
  slug?: string | null | void;
  userID?: string | null | void;
  username?: string | null | void;
  visible?: boolean | null | void;
}

/** 'Find' return type */
export interface IFindResult {
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  id: string;
  slug: string;
  summary: string | null;
  title: string;
  userID: string;
  views: number;
  visible: boolean;
}

/** 'Find' query type */
export interface IFindQuery {
  params: IFindParams;
  result: IFindResult;
}

const findIR: any = {"usedParamSet":{"userID":true,"username":true,"id":true,"visible":true,"slug":true,"search":true,"nextID":true,"recentFirst":true,"limit":true},"params":[{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":70,"b":76},{"a":613,"b":619}]},{"name":"username","required":false,"transform":{"type":"scalar"},"locs":[{"a":92,"b":100},{"a":535,"b":543}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":371,"b":373},{"a":378,"b":380}]},{"name":"visible","required":false,"transform":{"type":"scalar"},"locs":[{"a":408,"b":415},{"a":420,"b":427}]},{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":452,"b":456},{"a":461,"b":465}]},{"name":"search","required":false,"transform":{"type":"scalar"},"locs":[{"a":675,"b":681},{"a":713,"b":719},{"a":736,"b":742}]},{"name":"nextID","required":false,"transform":{"type":"scalar"},"locs":[{"a":764,"b":770},{"a":945,"b":951},{"a":1026,"b":1032},{"a":1038,"b":1044}]},{"name":"recentFirst","required":false,"transform":{"type":"scalar"},"locs":[{"a":804,"b":815},{"a":1086,"b":1097}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":1174,"b":1179}]}],"statement":"WITH \n  mapped_user_id AS (SELECT user_id FROM users WHERE user_uid = :userID OR username = :username)\nSELECT \n  post_uid as id,\n  slug as slug,\n  (select user_uid from users u where u.user_id = p.user_id) as \"userID!\",\n  title,\n  summary,\n  body,\n  visible,\n  num_views as \"views\",\n  created_at as \"createdAt\",\n  edited_at as \"editedAt\"\nFROM posts p\nWHERE\n  (post_uid = :id OR :id IS NULL)\n  AND (visible = :visible OR :visible IS NULL)\n  AND (slug = :slug OR :slug IS NULL)\n  AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :username IS NULL)\n  AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :userID IS NULL)\n  AND ((text_search @@ to_tsquery('english', :search || ':*') OR similarity(title, :search) > 0.1)\n    OR :search IS NULL\n  ) \n  AND (:nextID::TEXT IS NULL OR \n    CASE WHEN :recentFirst \n      THEN (COALESCE(edited_at, created_at) < (\n        SELECT COALESCE(edited_at, created_at) FROM posts d WHERE d.post_uid = :nextID)\n  ) ELSE (num_views < (SELECT num_views FROM posts p WHERE p.post_uid = :nextID) OR :nextID IS NULL)\n    END)\n  ORDER BY (CASE WHEN :recentFirst THEN COALESCE(edited_at, created_at) END) DESC,\n    num_views DESC\n  LIMIT :limit"};

/**
 * Query generated from SQL:
 * ```
 * WITH 
 *   mapped_user_id AS (SELECT user_id FROM users WHERE user_uid = :userID OR username = :username)
 * SELECT 
 *   post_uid as id,
 *   slug as slug,
 *   (select user_uid from users u where u.user_id = p.user_id) as "userID!",
 *   title,
 *   summary,
 *   body,
 *   visible,
 *   num_views as "views",
 *   created_at as "createdAt",
 *   edited_at as "editedAt"
 * FROM posts p
 * WHERE
 *   (post_uid = :id OR :id IS NULL)
 *   AND (visible = :visible OR :visible IS NULL)
 *   AND (slug = :slug OR :slug IS NULL)
 *   AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :username IS NULL)
 *   AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :userID IS NULL)
 *   AND ((text_search @@ to_tsquery('english', :search || ':*') OR similarity(title, :search) > 0.1)
 *     OR :search IS NULL
 *   ) 
 *   AND (:nextID::TEXT IS NULL OR 
 *     CASE WHEN :recentFirst 
 *       THEN (COALESCE(edited_at, created_at) < (
 *         SELECT COALESCE(edited_at, created_at) FROM posts d WHERE d.post_uid = :nextID)
 *   ) ELSE (num_views < (SELECT num_views FROM posts p WHERE p.post_uid = :nextID) OR :nextID IS NULL)
 *     END)
 *   ORDER BY (CASE WHEN :recentFirst THEN COALESCE(edited_at, created_at) END) DESC,
 *     num_views DESC
 *   LIMIT :limit
 * ```
 */
export const find = new PreparedQuery<IFindParams,IFindResult>(findIR);


/** 'GetPk' parameters type */
export interface IGetPkParams {
  id?: string | null | void;
}

/** 'GetPk' return type */
export interface IGetPkResult {
  pk: number;
}

/** 'GetPk' query type */
export interface IGetPkQuery {
  params: IGetPkParams;
  result: IGetPkResult;
}

const getPkIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":51,"b":53}]}],"statement":"SELECT post_id as \"pk\" from posts WHERE post_uid = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT post_id as "pk" from posts WHERE post_uid = :id
 * ```
 */
export const getPk = new PreparedQuery<IGetPkParams,IGetPkResult>(getPkIR);


/** 'AddView' parameters type */
export interface IAddViewParams {
  id?: string | null | void;
}

/** 'AddView' return type */
export type IAddViewResult = void;

/** 'AddView' query type */
export interface IAddViewQuery {
  params: IAddViewParams;
  result: IAddViewResult;
}

const addViewIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":60,"b":62}]}],"statement":"UPDATE posts SET num_views = num_views + 1 WHERE post_uid = :id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE posts SET num_views = num_views + 1 WHERE post_uid = :id
 * ```
 */
export const addView = new PreparedQuery<IAddViewParams,IAddViewResult>(addViewIR);


/** 'Insert' parameters type */
export interface IInsertParams {
  body: string;
  postID: string;
  slug?: string | null | void;
  summary?: string | null | void;
  title: string;
  userID: string;
}

/** 'Insert' return type */
export type IInsertResult = void;

/** 'Insert' query type */
export interface IInsertQuery {
  params: IInsertParams;
  result: IInsertResult;
}

const insertIR: any = {"usedParamSet":{"userID":true,"postID":true,"slug":true,"title":true,"summary":true,"body":true},"params":[{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":135,"b":142}]},{"name":"postID","required":true,"transform":{"type":"scalar"},"locs":[{"a":148,"b":155}]},{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":160,"b":164}]},{"name":"title","required":true,"transform":{"type":"scalar"},"locs":[{"a":169,"b":175}]},{"name":"summary","required":false,"transform":{"type":"scalar"},"locs":[{"a":180,"b":187}]},{"name":"body","required":true,"transform":{"type":"scalar"},"locs":[{"a":192,"b":197}]}],"statement":"INSERT INTO posts (\n  user_id,\n  post_uid,\n  slug,\n  title,\n  summary,\n  body\n) VALUES (\n  (SELECT user_id FROM users where user_uid = :userID!),\n  :postID!,\n  :slug,\n  :title!,\n  :summary,\n  :body!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO posts (
 *   user_id,
 *   post_uid,
 *   slug,
 *   title,
 *   summary,
 *   body
 * ) VALUES (
 *   (SELECT user_id FROM users where user_uid = :userID!),
 *   :postID!,
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
  body?: string | null | void;
  id?: string | null | void;
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

const updateIR: any = {"usedParamSet":{"slug":true,"title":true,"summary":true,"body":true,"visible":true,"id":true},"params":[{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":35,"b":39}]},{"name":"title","required":false,"transform":{"type":"scalar"},"locs":[{"a":68,"b":73}]},{"name":"summary","required":false,"transform":{"type":"scalar"},"locs":[{"a":105,"b":112}]},{"name":"body","required":false,"transform":{"type":"scalar"},"locs":[{"a":143,"b":147}]},{"name":"visible","required":false,"transform":{"type":"scalar"},"locs":[{"a":178,"b":185}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":214,"b":216}]}],"statement":"UPDATE posts\nSET\n  slug = COALESCE(:slug, slug),\n  title = COALESCE(:title, title),\n  summary = COALESCE(:summary, summary),\n  body = COALESCE(:body, body),\n  visible = COALESCE(:visible, visible)\nWHERE post_uid = :id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE posts
 * SET
 *   slug = COALESCE(:slug, slug),
 *   title = COALESCE(:title, title),
 *   summary = COALESCE(:summary, summary),
 *   body = COALESCE(:body, body),
 *   visible = COALESCE(:visible, visible)
 * WHERE post_uid = :id
 * ```
 */
export const update = new PreparedQuery<IUpdateParams,IUpdateResult>(updateIR);


/** 'Remove' parameters type */
export interface IRemoveParams {
  ids: readonly (string | null | void)[];
}

/** 'Remove' return type */
export type IRemoveResult = void;

/** 'Remove' query type */
export interface IRemoveQuery {
  params: IRemoveParams;
  result: IRemoveResult;
}

const removeIR: any = {"usedParamSet":{"ids":true},"params":[{"name":"ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":36,"b":39}]}],"statement":"DELETE FROM posts WHERE post_uid IN :ids"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM posts WHERE post_uid IN :ids
 * ```
 */
export const remove = new PreparedQuery<IRemoveParams,IRemoveResult>(removeIR);


