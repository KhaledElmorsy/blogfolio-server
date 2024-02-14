/** Types generated for queries found in "src/db/queries/comments/comments.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'Tree' parameters type */
export interface ITreeParams {
  depth?: number | null | void;
  node: number;
}

/** 'Tree' return type */
export interface ITreeResult {
  body: Json | null;
  createdAt: Date | null;
  editedAt: Date | null;
  id: string | null;
  node: number | null;
  parentNode: number | null;
  user__id: number | null;
}

/** 'Tree' query type */
export interface ITreeQuery {
  params: ITreeParams;
  result: ITreeResult;
}

const treeIR: any = {"usedParamSet":{"node":true,"depth":true},"params":[{"name":"node","required":true,"transform":{"type":"scalar"},"locs":[{"a":169,"b":174}]},{"name":"depth","required":false,"transform":{"type":"scalar"},"locs":[{"a":389,"b":394},{"a":399,"b":404}]}],"statement":"WITH RECURSIVE comment_tree AS (\n\tSELECT 1 as depth, root.parent_node_id, rc.*\n\tFROM nodes root\n\tINNER JOIN comments rc on rc.node_id = root.node_id\n\tAND root.node_id = :node!\n\tUNION\n\tSELECT ct.depth+1 as n, child.parent_node_id, cc.*\n\tFROM nodes child\n\tINNER JOIN comments cc on cc.node_id = child.node_id\n\tINNER JOIN comment_tree ct ON child.parent_node_id = ct.node_id\n\tAND (ct.depth < :depth OR :depth IS NULL)\n) select \n\tparent_node_id as \"parentNode\",\n\tnode_id as node,\n\tcomment_uid as id,\n\tuser_id as \"user__id\",\n\tbody,\n\tcreated_at as \"createdAt\",\n\tedited_at as \"editedAt\"\nfrom comment_tree"};

/**
 * Query generated from SQL:
 * ```
 * WITH RECURSIVE comment_tree AS (
 * 	SELECT 1 as depth, root.parent_node_id, rc.*
 * 	FROM nodes root
 * 	INNER JOIN comments rc on rc.node_id = root.node_id
 * 	AND root.node_id = :node!
 * 	UNION
 * 	SELECT ct.depth+1 as n, child.parent_node_id, cc.*
 * 	FROM nodes child
 * 	INNER JOIN comments cc on cc.node_id = child.node_id
 * 	INNER JOIN comment_tree ct ON child.parent_node_id = ct.node_id
 * 	AND (ct.depth < :depth OR :depth IS NULL)
 * ) select 
 * 	parent_node_id as "parentNode",
 * 	node_id as node,
 * 	comment_uid as id,
 * 	user_id as "user__id",
 * 	body,
 * 	created_at as "createdAt",
 * 	edited_at as "editedAt"
 * from comment_tree
 * ```
 */
export const tree = new PreparedQuery<ITreeParams,ITreeResult>(treeIR);


/** 'GetId' parameters type */
export interface IGetIdParams {
  id: string;
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

const getIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":65}]}],"statement":"SELECT comment_id as \"__id\" FROM comments WHERE comment_uid = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT comment_id as "__id" FROM comments WHERE comment_uid = :id!
 * ```
 */
export const getId = new PreparedQuery<IGetIdParams,IGetIdResult>(getIdIR);


/** 'Find' parameters type */
export interface IFindParams {
  __id?: number | null | void;
  id?: string | null | void;
  node?: number | null | void;
  user__id?: number | null | void;
}

/** 'Find' return type */
export interface IFindResult {
  body: Json | null;
  createdAt: Date | null;
  editedAt: Date | null;
  id: string;
  node: number | null;
  userId: string;
}

/** 'Find' query type */
export interface IFindQuery {
  params: IFindParams;
  result: IFindResult;
}

const findIR: any = {"usedParamSet":{"__id":true,"id":true,"node":true,"user__id":true},"params":[{"name":"__id","required":false,"transform":{"type":"scalar"},"locs":[{"a":232,"b":236},{"a":241,"b":245}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":279,"b":281},{"a":286,"b":288}]},{"name":"node","required":false,"transform":{"type":"scalar"},"locs":[{"a":318,"b":322},{"a":327,"b":331}]},{"name":"user__id","required":false,"transform":{"type":"scalar"},"locs":[{"a":361,"b":369},{"a":374,"b":382}]}],"statement":"SELECT \n  c.comment_uid as id,\n  u.user_uid as \"userId\",\n  c.body,\n  c.node_id as node,\n  c.created_at as \"createdAt\",\n  c.edited_at as \"editedAt\"\nFROM comments c\nINNER JOIN users u ON c.user_id = u.user_id\nWHERE \n  (c.comment_id = :__id OR :__id is NULL)\n  AND (c.comment_uid = :id OR :id is NULL)\n  AND (c.node_id = :node OR :node is NULL)\n  AND (c.user_id = :user__id OR :user__id is NULL)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   c.comment_uid as id,
 *   u.user_uid as "userId",
 *   c.body,
 *   c.node_id as node,
 *   c.created_at as "createdAt",
 *   c.edited_at as "editedAt"
 * FROM comments c
 * INNER JOIN users u ON c.user_id = u.user_id
 * WHERE 
 *   (c.comment_id = :__id OR :__id is NULL)
 *   AND (c.comment_uid = :id OR :id is NULL)
 *   AND (c.node_id = :node OR :node is NULL)
 *   AND (c.user_id = :user__id OR :user__id is NULL)
 * ```
 */
export const find = new PreparedQuery<IFindParams,IFindResult>(findIR);


/** 'Edit' parameters type */
export interface IEditParams {
  body: Json;
  id: number;
}

/** 'Edit' return type */
export type IEditResult = void;

/** 'Edit' query type */
export interface IEditQuery {
  params: IEditParams;
  result: IEditResult;
}

const editIR: any = {"usedParamSet":{"body":true,"id":true},"params":[{"name":"body","required":true,"transform":{"type":"scalar"},"locs":[{"a":28,"b":33}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":57}]}],"statement":"UPDATE comments \nSET body = :body!\nWHERE comment_id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE comments 
 * SET body = :body!
 * WHERE comment_id = :id!
 * ```
 */
export const edit = new PreparedQuery<IEditParams,IEditResult>(editIR);


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

const dropIR: any = {"usedParamSet":{"__ids":true},"params":[{"name":"__ids","required":false,"transform":{"type":"array_spread"},"locs":[{"a":41,"b":46}]}],"statement":"DELETE FROM comments WHERE comment_id in :__ids"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM comments WHERE comment_id in :__ids
 * ```
 */
export const drop = new PreparedQuery<IDropParams,IDropResult>(dropIR);


/** Query 'Test' is invalid, so its result is assigned type 'never'.
 *  */
export type ITestResult = never;

/** Query 'Test' is invalid, so its parameters are assigned type 'never'.
 *  */
export type ITestParams = never;

const testIR: any = {"usedParamSet":{"userId":true,"id":true,"body":true,"parentNode":true},"params":[{"name":"userId","required":false,"transform":{"type":"scalar"},"locs":[{"a":21,"b":27}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":30,"b":32}]},{"name":"body","required":false,"transform":{"type":"scalar"},"locs":[{"a":35,"b":39}]},{"name":"parentNode","required":false,"transform":{"type":"scalar"},"locs":[{"a":42,"b":52}]}],"statement":"SELECT createComment(:userId, :id, :body, :parentNode)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT createComment(:userId, :id, :body, :parentNode)
 * ```
 */
export const test = new PreparedQuery<ITestParams,ITestResult>(testIR);


