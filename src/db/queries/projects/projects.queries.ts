/** Types generated for queries found in "src/db/queries/projects/projects.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = (string)[];

/** 'Get' parameters type */
export interface IGetParams {
  projectID?: string | null | void;
  userID?: string | null | void;
}

/** 'Get' return type */
export interface IGetResult {
  description: string;
  name: string;
  priority: number;
  projectID: string;
  skills: stringArray | null;
  userID: string;
}

/** 'Get' query type */
export interface IGetQuery {
  params: IGetParams;
  result: IGetResult;
}

const getIR: any = {"usedParamSet":{"projectID":true,"userID":true},"params":[{"name":"projectID","required":false,"transform":{"type":"scalar"},"locs":[{"a":181,"b":190},{"a":195,"b":204}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":233,"b":239},{"a":244,"b":250}]}],"statement":"SELECT\n project_uid as \"projectID\",\n priority,\n description,\n name,\n skills,\n u.user_uid as \"userID\"\nFROM projects p\nLEFT JOIN users u ON p.user_id = u.user_id\nWHERE (project_uid = :projectID OR :projectID IS NULL)\nAND (u.user_uid = :userID OR :userID IS NULL)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *  project_uid as "projectID",
 *  priority,
 *  description,
 *  name,
 *  skills,
 *  u.user_uid as "userID"
 * FROM projects p
 * LEFT JOIN users u ON p.user_id = u.user_id
 * WHERE (project_uid = :projectID OR :projectID IS NULL)
 * AND (u.user_uid = :userID OR :userID IS NULL)
 * ```
 */
export const get = new PreparedQuery<IGetParams,IGetResult>(getIR);


/** 'Insert' parameters type */
export interface IInsertParams {
  description: string;
  name: string;
  priority: number;
  projectID: string;
  skills?: stringArray | null | void;
  userID: string;
}

/** 'Insert' return type */
export type IInsertResult = void;

/** 'Insert' query type */
export interface IInsertQuery {
  params: IInsertParams;
  result: IInsertResult;
}

const insertIR: any = {"usedParamSet":{"projectID":true,"userID":true,"name":true,"description":true,"skills":true,"priority":true},"params":[{"name":"projectID","required":true,"transform":{"type":"scalar"},"locs":[{"a":106,"b":116}]},{"name":"userID","required":true,"transform":{"type":"scalar"},"locs":[{"a":165,"b":172}]},{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":178,"b":183}]},{"name":"description","required":true,"transform":{"type":"scalar"},"locs":[{"a":188,"b":200}]},{"name":"skills","required":false,"transform":{"type":"scalar"},"locs":[{"a":205,"b":211}]},{"name":"priority","required":true,"transform":{"type":"scalar"},"locs":[{"a":216,"b":225}]}],"statement":"INSERT INTO projects (\n  project_uid,\n  user_id,\n  name,\n  description,\n  skills,\n  priority\n) VALUES (\n  :projectID!,\n  (SELECT user_id FROM users WHERE user_uid = :userID!),\n  :name!,\n  :description!,\n  :skills,\n  :priority!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO projects (
 *   project_uid,
 *   user_id,
 *   name,
 *   description,
 *   skills,
 *   priority
 * ) VALUES (
 *   :projectID!,
 *   (SELECT user_id FROM users WHERE user_uid = :userID!),
 *   :name!,
 *   :description!,
 *   :skills,
 *   :priority!
 * )
 * ```
 */
export const insert = new PreparedQuery<IInsertParams,IInsertResult>(insertIR);


/** 'Update' parameters type */
export interface IUpdateParams {
  description?: string | null | void;
  name?: string | null | void;
  priority?: number | null | void;
  projectID?: string | null | void;
  skills?: stringArray | null | void;
}

/** 'Update' return type */
export type IUpdateResult = void;

/** 'Update' query type */
export interface IUpdateQuery {
  params: IUpdateParams;
  result: IUpdateResult;
}

const updateIR: any = {"usedParamSet":{"name":true,"description":true,"skills":true,"priority":true,"projectID":true},"params":[{"name":"name","required":false,"transform":{"type":"scalar"},"locs":[{"a":39,"b":43}]},{"name":"description","required":false,"transform":{"type":"scalar"},"locs":[{"a":78,"b":89}]},{"name":"skills","required":false,"transform":{"type":"scalar"},"locs":[{"a":126,"b":132}]},{"name":"priority","required":false,"transform":{"type":"scalar"},"locs":[{"a":166,"b":174}]},{"name":"projectID","required":false,"transform":{"type":"scalar"},"locs":[{"a":207,"b":216}]}],"statement":"UPDATE projects \nSET\n  name = COALESCE(:name, name),\n  description = COALESCE(:description, description),\n  skills = COALESCE(:skills, skills),\n  priority = COALESCE(:priority, priority)\nWHERE project_uid = :projectID"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE projects 
 * SET
 *   name = COALESCE(:name, name),
 *   description = COALESCE(:description, description),
 *   skills = COALESCE(:skills, skills),
 *   priority = COALESCE(:priority, priority)
 * WHERE project_uid = :projectID
 * ```
 */
export const update = new PreparedQuery<IUpdateParams,IUpdateResult>(updateIR);


/** 'Remove' parameters type */
export interface IRemoveParams {
  projectID?: string | null | void;
}

/** 'Remove' return type */
export type IRemoveResult = void;

/** 'Remove' query type */
export interface IRemoveQuery {
  params: IRemoveParams;
  result: IRemoveResult;
}

const removeIR: any = {"usedParamSet":{"projectID":true},"params":[{"name":"projectID","required":false,"transform":{"type":"scalar"},"locs":[{"a":41,"b":50}]}],"statement":"DELETE FROM projects WHERE project_uid = :projectID"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM projects WHERE project_uid = :projectID
 * ```
 */
export const remove = new PreparedQuery<IRemoveParams,IRemoveResult>(removeIR);


