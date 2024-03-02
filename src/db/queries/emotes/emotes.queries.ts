/** Types generated for queries found in "src/db/queries/emotes/emotes.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = (string)[];

/** 'GetEmotes' parameters type */
export type IGetEmotesParams = void;

/** 'GetEmotes' return type */
export interface IGetEmotesResult {
  body: string;
  id: number;
}

/** 'GetEmotes' query type */
export interface IGetEmotesQuery {
  params: IGetEmotesParams;
  result: IGetEmotesResult;
}

const getEmotesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT emote_id as \"id\", emote_body as \"body\" FROM emotes"};

/**
 * Query generated from SQL:
 * ```
 * SELECT emote_id as "id", emote_body as "body" FROM emotes
 * ```
 */
export const getEmotes = new PreparedQuery<IGetEmotesParams,IGetEmotesResult>(getEmotesIR);


/** 'GetPosts' parameters type */
export interface IGetPostsParams {
  postIDs?: stringArray | null | void;
  userID?: string | null | void;
}

/** 'GetPosts' return type */
export interface IGetPostsResult {
  id: number;
  postID: string;
  userID: string;
}

/** 'GetPosts' query type */
export interface IGetPostsQuery {
  params: IGetPostsParams;
  result: IGetPostsResult;
}

const getPostsIR: any = {"usedParamSet":{"postIDs":true,"userID":true},"params":[{"name":"postIDs","required":false,"transform":{"type":"scalar"},"locs":[{"a":255,"b":262}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":327,"b":333},{"a":339,"b":345}]}],"statement":"SELECT \n  (SELECT user_uid FROM users WHERE user_id = e.user_id) as \"userID!\",\n  (SELECT post_uid FROM posts WHERE post_id = e.post_id) as \"postID!\",\n  emote_id as \"id!\"\nFROM post_emotes e\nWHERE post_id IN (SELECT post_id FROM posts WHERE post_uid = ANY (:postIDs))\nAND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   (SELECT user_uid FROM users WHERE user_id = e.user_id) as "userID!",
 *   (SELECT post_uid FROM posts WHERE post_id = e.post_id) as "postID!",
 *   emote_id as "id!"
 * FROM post_emotes e
 * WHERE post_id IN (SELECT post_id FROM posts WHERE post_uid = ANY (:postIDs))
 * AND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL)
 * ```
 */
export const getPosts = new PreparedQuery<IGetPostsParams,IGetPostsResult>(getPostsIR);


/** 'GetComments' parameters type */
export interface IGetCommentsParams {
  commentIDs?: stringArray | null | void;
  userID?: string | null | void;
}

/** 'GetComments' return type */
export interface IGetCommentsResult {
  commentID: string;
  id: number;
  userID: string;
}

/** 'GetComments' query type */
export interface IGetCommentsQuery {
  params: IGetCommentsParams;
  result: IGetCommentsResult;
}

const getCommentsIR: any = {"usedParamSet":{"commentIDs":true,"userID":true},"params":[{"name":"commentIDs","required":false,"transform":{"type":"scalar"},"locs":[{"a":285,"b":295}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":360,"b":366},{"a":372,"b":378}]}],"statement":"SELECT \n  (SELECT user_uid FROM users WHERE user_id = e.user_id) as \"userID!\",\n  (SELECT comment_uid FROM comments WHERE comment_id = e.comment_id) as \"commentID!\",\n  emote_id as \"id!\"\nFROM comment_emotes e\nWHERE comment_id IN (SELECT comment_id FROM comments WHERE comment_uid = ANY (:commentIDs))\nAND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   (SELECT user_uid FROM users WHERE user_id = e.user_id) as "userID!",
 *   (SELECT comment_uid FROM comments WHERE comment_id = e.comment_id) as "commentID!",
 *   emote_id as "id!"
 * FROM comment_emotes e
 * WHERE comment_id IN (SELECT comment_id FROM comments WHERE comment_uid = ANY (:commentIDs))
 * AND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL)
 * ```
 */
export const getComments = new PreparedQuery<IGetCommentsParams,IGetCommentsResult>(getCommentsIR);


/** 'InsertForPost' parameters type */
export interface IInsertForPostParams {
  id?: number | null | void;
  postID?: string | null | void;
  userID?: string | null | void;
}

/** 'InsertForPost' return type */
export type IInsertForPostResult = void;

/** 'InsertForPost' query type */
export interface IInsertForPostQuery {
  params: IInsertForPostParams;
  result: IInsertForPostResult;
}

const insertForPostIR: any = {"usedParamSet":{"postID":true,"userID":true,"id":true},"params":[{"name":"postID","required":false,"transform":{"type":"scalar"},"locs":[{"a":108,"b":114}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":164,"b":170}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":176,"b":178}]}],"statement":"INSERT INTO post_emotes (post_id, user_id, emote_id) VALUES (\n  (SELECT post_id FROM posts WHERE post_uid = :postID),\n  (SELECT user_id FROM users WHERE user_uid = :userID),\n  :id\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO post_emotes (post_id, user_id, emote_id) VALUES (
 *   (SELECT post_id FROM posts WHERE post_uid = :postID),
 *   (SELECT user_id FROM users WHERE user_uid = :userID),
 *   :id
 * )
 * ```
 */
export const insertForPost = new PreparedQuery<IInsertForPostParams,IInsertForPostResult>(insertForPostIR);


/** 'InsertForComment' parameters type */
export interface IInsertForCommentParams {
  commentID?: string | null | void;
  id?: number | null | void;
  userID?: string | null | void;
}

/** 'InsertForComment' return type */
export type IInsertForCommentResult = void;

/** 'InsertForComment' query type */
export interface IInsertForCommentQuery {
  params: IInsertForCommentParams;
  result: IInsertForCommentResult;
}

const insertForCommentIR: any = {"usedParamSet":{"commentID":true,"userID":true,"id":true},"params":[{"name":"commentID","required":false,"transform":{"type":"scalar"},"locs":[{"a":123,"b":132}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":182,"b":188}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":194,"b":196}]}],"statement":"INSERT INTO comment_emotes (comment_id, user_id, emote_id) VALUES (\n  (SELECT comment_id FROM comments WHERE comment_uid = :commentID),\n  (SELECT user_id FROM users WHERE user_uid = :userID),\n  :id\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO comment_emotes (comment_id, user_id, emote_id) VALUES (
 *   (SELECT comment_id FROM comments WHERE comment_uid = :commentID),
 *   (SELECT user_id FROM users WHERE user_uid = :userID),
 *   :id
 * )
 * ```
 */
export const insertForComment = new PreparedQuery<IInsertForCommentParams,IInsertForCommentResult>(insertForCommentIR);


/** 'UpdatePostEmote' parameters type */
export interface IUpdatePostEmoteParams {
  id?: number | null | void;
  postID?: string | null | void;
  userID?: string | null | void;
}

/** 'UpdatePostEmote' return type */
export type IUpdatePostEmoteResult = void;

/** 'UpdatePostEmote' query type */
export interface IUpdatePostEmoteQuery {
  params: IUpdatePostEmoteParams;
  result: IUpdatePostEmoteResult;
}

const updatePostEmoteIR: any = {"usedParamSet":{"id":true,"userID":true,"postID":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":34,"b":36}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":98,"b":104}]},{"name":"postID","required":false,"transform":{"type":"scalar"},"locs":[{"a":165,"b":171}]}],"statement":"UPDATE post_emotes SET emote_id = :id\nWHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)\nAND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID)"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE post_emotes SET emote_id = :id
 * WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
 * AND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID)
 * ```
 */
export const updatePostEmote = new PreparedQuery<IUpdatePostEmoteParams,IUpdatePostEmoteResult>(updatePostEmoteIR);


/** 'UpdateCommentEmote' parameters type */
export interface IUpdateCommentEmoteParams {
  commentID?: string | null | void;
  id?: number | null | void;
  userID?: string | null | void;
}

/** 'UpdateCommentEmote' return type */
export type IUpdateCommentEmoteResult = void;

/** 'UpdateCommentEmote' query type */
export interface IUpdateCommentEmoteQuery {
  params: IUpdateCommentEmoteParams;
  result: IUpdateCommentEmoteResult;
}

const updateCommentEmoteIR: any = {"usedParamSet":{"id":true,"userID":true,"commentID":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":37,"b":39}]},{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":101,"b":107}]},{"name":"commentID","required":false,"transform":{"type":"scalar"},"locs":[{"a":180,"b":189}]}],"statement":"UPDATE comment_emotes SET emote_id = :id\nWHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)\nAND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID)"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE comment_emotes SET emote_id = :id
 * WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
 * AND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID)
 * ```
 */
export const updateCommentEmote = new PreparedQuery<IUpdateCommentEmoteParams,IUpdateCommentEmoteResult>(updateCommentEmoteIR);


/** 'RemoveFromPost' parameters type */
export interface IRemoveFromPostParams {
  postID?: string | null | void;
  userID?: string | null | void;
}

/** 'RemoveFromPost' return type */
export type IRemoveFromPostResult = void;

/** 'RemoveFromPost' query type */
export interface IRemoveFromPostQuery {
  params: IRemoveFromPostParams;
  result: IRemoveFromPostResult;
}

const removeFromPostIR: any = {"usedParamSet":{"userID":true,"postID":true},"params":[{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":84,"b":90}]},{"name":"postID","required":false,"transform":{"type":"scalar"},"locs":[{"a":151,"b":157}]}],"statement":"DELETE FROM post_emotes\nWHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)\nAND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID)"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM post_emotes
 * WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
 * AND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID)
 * ```
 */
export const removeFromPost = new PreparedQuery<IRemoveFromPostParams,IRemoveFromPostResult>(removeFromPostIR);


/** 'RemoveFromComment' parameters type */
export interface IRemoveFromCommentParams {
  commentID?: string | null | void;
  userID?: string | null | void;
}

/** 'RemoveFromComment' return type */
export type IRemoveFromCommentResult = void;

/** 'RemoveFromComment' query type */
export interface IRemoveFromCommentQuery {
  params: IRemoveFromCommentParams;
  result: IRemoveFromCommentResult;
}

const removeFromCommentIR: any = {"usedParamSet":{"userID":true,"commentID":true},"params":[{"name":"userID","required":false,"transform":{"type":"scalar"},"locs":[{"a":87,"b":93}]},{"name":"commentID","required":false,"transform":{"type":"scalar"},"locs":[{"a":166,"b":175}]}],"statement":"DELETE FROM comment_emotes\nWHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)\nAND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID)"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM comment_emotes
 * WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
 * AND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID)
 * ```
 */
export const removeFromComment = new PreparedQuery<IRemoveFromCommentParams,IRemoveFromCommentResult>(removeFromCommentIR);


