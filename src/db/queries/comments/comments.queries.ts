/** Types generated for queries found in "src/db/queries/comments/comments.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = (string)[];

/** 'Tree' parameters type */
export interface ITreeParams {
  depth?: number | null | void;
  postID?: string | null | void;
  rootCommentID?: string | null | void;
}

/** 'Tree' return type */
export interface ITreeResult {
  id: string;
  parentPK: number | null;
  pk: number;
}

/** 'Tree' query type */
export interface ITreeQuery {
  params: ITreeParams;
  result: ITreeResult;
}

const treeIR: any = {"usedParamSet":{"postID":true,"rootCommentID":true,"depth":true},"params":[{"name":"postID","required":false,"transform":{"type":"scalar"},"locs":[{"a":200,"b":206},{"a":212,"b":218}]},{"name":"rootCommentID","required":false,"transform":{"type":"scalar"},"locs":[{"a":249,"b":262},{"a":267,"b":280}]},{"name":"depth","required":false,"transform":{"type":"scalar"},"locs":[{"a":456,"b":461},{"a":466,"b":471}]}],"statement":"WITH RECURSIVE comment_tree(comment_id, parent_comment_id, depth) AS (\n\tSELECT comment_id, parent_comment_id, 0\n\tFROM comments c\n\tWHERE \n\t\t(c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)\n\tAND (comment_uid = :rootCommentID OR :rootCommentID IS NULL)\n\t\n\tUNION ALL\n\n\tSELECT c.comment_id, c.parent_comment_id, depth + 1\n\tFROM comments c\n\tINNER JOIN comment_tree ct ON ct.comment_id = c.parent_comment_id\n\tAND (depth < :depth OR :depth IS NULL) \n) SELECT co.comment_uid as \"id\", co.comment_id as \"pk\", co.parent_comment_id as \"parentPK\"\nFROM comment_tree ct\nINNER JOIN comments co ON ct.comment_id = co.comment_id"};

/**
 * Query generated from SQL:
 * ```
 * WITH RECURSIVE comment_tree(comment_id, parent_comment_id, depth) AS (
 * 	SELECT comment_id, parent_comment_id, 0
 * 	FROM comments c
 * 	WHERE 
 * 		(c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)
 * 	AND (comment_uid = :rootCommentID OR :rootCommentID IS NULL)
 * 	
 * 	UNION ALL
 * 
 * 	SELECT c.comment_id, c.parent_comment_id, depth + 1
 * 	FROM comments c
 * 	INNER JOIN comment_tree ct ON ct.comment_id = c.parent_comment_id
 * 	AND (depth < :depth OR :depth IS NULL) 
 * ) SELECT co.comment_uid as "id", co.comment_id as "pk", co.parent_comment_id as "parentPK"
 * FROM comment_tree ct
 * INNER JOIN comments co ON ct.comment_id = co.comment_id
 * ```
 */
export const tree = new PreparedQuery<ITreeParams,ITreeResult>(treeIR);


/** 'Find' parameters type */
export interface IFindParams {
  ids?: stringArray | null | void;
  limit?: number | null | void;
  nextID?: string | null | void;
  popular?: boolean | null | void;
  postID?: string | null | void;
  slug?: string | null | void;
  userID?: string | null | void;
  username?: string | null | void;
}

/** 'Find' return type */
export interface IFindResult {
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  emotes: number;
  id: string;
  parentID: string | null;
  postID: string;
  userID: string | null;
}

/** 'Find' query type */
export interface IFindQuery {
  params: IFindParams;
  result: IFindResult;
}

const findIR: any = {"usedParamSet":{"ids":true,"userID":true,"postID":true,"username":true,"slug":true,"nextID":true,"popular":true,"limit":true},"params":[{"name":"ids","required":false,"transform":{"type":"scalar"},"locs":[{"a":489,"b":492},{"a":498,"b":501}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":579,"b":585},{"a":591,"b":597}]},{"name":"postID","required":false,"transform":{"type":"scalar"},"locs":[{"a":675,"b":681},{"a":687,"b":693}]},{"name":"username","required":false,"transform":{"type":"scalar"},"locs":[{"a":771,"b":779},{"a":785,"b":793}]},{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":867,"b":871},{"a":877,"b":881}]},{"name":"nextID","required":false,"transform":{"type":"scalar"},"locs":[{"a":899,"b":905},{"a":1031,"b":1037},{"a":1043,"b":1049},{"a":1316,"b":1322},{"a":1356,"b":1362},{"a":1407,"b":1413}]},{"name":"popular","required":false,"transform":{"type":"scalar"},"locs":[{"a":937,"b":944},{"a":1336,"b":1343},{"a":1382,"b":1389},{"a":1448,"b":1455}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":1583,"b":1588}]}],"statement":"SELECT \n  comment_uid as id,\n\t(SELECT user_uid FROM users u WHERE u.user_id = c.user_id) as \"userID\",\n\t(SELECT comment_uid FROM comments sc WHERE sc.comment_id = c.parent_comment_id) as \"parentID\",\n\t(SELECT post_uid FROM posts p WHERE p.post_id = c.post_id) as \"postID!\",\n  body,\n  created_at as \"createdAt\",\n  edited_at as \"editedAt\",\n\tCOALESCE(count(ce.comment_id),0) as \"emotes!\"\nFROM comments c\nLEFT JOIN comment_emotes ce ON c.comment_id = ce.comment_id\nWHERE \n   (comment_uid = ANY (:ids) OR :ids is NULL)\n  AND (c.user_id = (SELECT user_id FROM users u WHERE u.user_uid = :userID) OR :userID IS NULL)\n  AND (c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)\n  AND (c.user_id = (SELECT user_id FROM users u WHERE u.username = :username) OR :username IS NULL)\n  AND (c.post_id = (SELECT post_id FROM posts p WHERE p.slug = :slug) OR :slug IS NULL)\n\tAND ( :nextID::TEXT IS NULL OR \n\t\tCASE WHEN :popular THEN  TRUE ELSE \n\t(created_at < (SELECT created_at FROM comments WHERE comment_uid = :nextID) OR :nextID IS NULL)\n\tEND)\nGROUP BY c.comment_id, id, \"userID\", \"parentID\", \"postID!\", body, \"createdAt\", \"editedAt\"\nHAVING (count(ce.comment_id) < (\n\tSELECT count(ce.comment_id) FROM comment_emotes ce WHERE comment_id = (\n\t\tSELECT comment_id FROM comments WHERE comment_uid = :nextID \n\t)\n)) OR ((:popular IS NULL OR :nextID IS NULL) AND NOT (:popular IS NOT NULL AND :nextID IS NOT NULL))\nORDER BY CASE WHEN :popular THEN (SELECT count(ce.comment_id) FROM comment_emotes ce WHERE ce.comment_id = c.comment_id) END DESC,\n\tcreated_at DESC\nLIMIT :limit"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   comment_uid as id,
 * 	(SELECT user_uid FROM users u WHERE u.user_id = c.user_id) as "userID",
 * 	(SELECT comment_uid FROM comments sc WHERE sc.comment_id = c.parent_comment_id) as "parentID",
 * 	(SELECT post_uid FROM posts p WHERE p.post_id = c.post_id) as "postID!",
 *   body,
 *   created_at as "createdAt",
 *   edited_at as "editedAt",
 * 	COALESCE(count(ce.comment_id),0) as "emotes!"
 * FROM comments c
 * LEFT JOIN comment_emotes ce ON c.comment_id = ce.comment_id
 * WHERE 
 *    (comment_uid = ANY (:ids) OR :ids is NULL)
 *   AND (c.user_id = (SELECT user_id FROM users u WHERE u.user_uid = :userID) OR :userID IS NULL)
 *   AND (c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)
 *   AND (c.user_id = (SELECT user_id FROM users u WHERE u.username = :username) OR :username IS NULL)
 *   AND (c.post_id = (SELECT post_id FROM posts p WHERE p.slug = :slug) OR :slug IS NULL)
 * 	AND ( :nextID::TEXT IS NULL OR 
 * 		CASE WHEN :popular THEN  TRUE ELSE 
 * 	(created_at < (SELECT created_at FROM comments WHERE comment_uid = :nextID) OR :nextID IS NULL)
 * 	END)
 * GROUP BY c.comment_id, id, "userID", "parentID", "postID!", body, "createdAt", "editedAt"
 * HAVING (count(ce.comment_id) < (
 * 	SELECT count(ce.comment_id) FROM comment_emotes ce WHERE comment_id = (
 * 		SELECT comment_id FROM comments WHERE comment_uid = :nextID 
 * 	)
 * )) OR ((:popular IS NULL OR :nextID IS NULL) AND NOT (:popular IS NOT NULL AND :nextID IS NOT NULL))
 * ORDER BY CASE WHEN :popular THEN (SELECT count(ce.comment_id) FROM comment_emotes ce WHERE ce.comment_id = c.comment_id) END DESC,
 * 	created_at DESC
 * LIMIT :limit
 * ```
 */
export const find = new PreparedQuery<IFindParams,IFindResult>(findIR);


/** 'Update' parameters type */
export interface IUpdateParams {
  body: string;
  id: string;
}

/** 'Update' return type */
export type IUpdateResult = void;

/** 'Update' query type */
export interface IUpdateQuery {
  params: IUpdateParams;
  result: IUpdateResult;
}

const updateIR: any = {"usedParamSet":{"body":true,"id":true},"params":[{"name":"body","required":true,"transform":{"type":"scalar"},"locs":[{"a":28,"b":33}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":58}]}],"statement":"UPDATE comments \nSET body = :body!\nWHERE comment_uid = :id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE comments 
 * SET body = :body!
 * WHERE comment_uid = :id!
 * ```
 */
export const update = new PreparedQuery<IUpdateParams,IUpdateResult>(updateIR);


/** 'Insert' parameters type */
export interface IInsertParams {
  body: string;
  id: string;
  parentID?: string | null | void;
  postID: string;
  userID: string;
}

/** 'Insert' return type */
export type IInsertResult = void;

/** 'Insert' query type */
export interface IInsertQuery {
  params: IInsertParams;
  result: IInsertResult;
}

const insertIR: any = {"usedParamSet":{"id":true,"parentID":true,"userID":true,"postID":true,"body":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":98}]},{"name":"parentID","required":false,"transform":{"type":"scalar"},"locs":[{"a":112,"b":120},{"a":207,"b":215}]},{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":269,"b":276}]},{"name":"postID","required":true,"transform":{"type":"scalar"},"locs":[{"a":325,"b":332}]},{"name":"body","required":true,"transform":{"type":"scalar"},"locs":[{"a":337,"b":342}]}],"statement":"INSERT INTO comments (\n\tcomment_uid,\n\tparent_comment_id,\n\tuser_id,\n\tpost_id,\n\tbody\n) VALUES (\n\t:id!,\n\tCASE WHEN :parentID::TEXT IS NULL THEN NULL \n\t\tELSE (SELECT comment_id FROM comments WHERE comment_uid = :parentID)\n\tEND,\n\t(SELECT user_id FROM users WHERE user_uid = :userID!),\n\t(SELECT post_id FROM posts WHERE post_uid = :postID!),\n\t:body!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO comments (
 * 	comment_uid,
 * 	parent_comment_id,
 * 	user_id,
 * 	post_id,
 * 	body
 * ) VALUES (
 * 	:id!,
 * 	CASE WHEN :parentID::TEXT IS NULL THEN NULL 
 * 		ELSE (SELECT comment_id FROM comments WHERE comment_uid = :parentID)
 * 	END,
 * 	(SELECT user_id FROM users WHERE user_uid = :userID!),
 * 	(SELECT post_id FROM posts WHERE post_uid = :postID!),
 * 	:body!
 * )
 * ```
 */
export const insert = new PreparedQuery<IInsertParams,IInsertResult>(insertIR);


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

const removeIR: any = {"usedParamSet":{"ids":true},"params":[{"name":"ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":42,"b":45}]}],"statement":"DELETE FROM comments WHERE comment_uid in :ids"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM comments WHERE comment_uid in :ids
 * ```
 */
export const remove = new PreparedQuery<IRemoveParams,IRemoveResult>(removeIR);


