import { comments as commentDB, pool } from '@/db';
import { IInsertParams } from '@/db/queries/comments/comments.queries';
import { nanoid } from 'nanoid';

export interface SortAndPaginationOpts {
  limit?: number;
  popular?: boolean;
  nextID?: string;
}

export function findBySlug(
  username: string,
  slug: string,
  options?: SortAndPaginationOpts,
) {
  return commentDB.find.run({ username, slug, ...options }, pool);
}

export function findByRelation(
  { postID, userID }: { postID?: string; userID?: string },
  options?: SortAndPaginationOpts,
) {
  return commentDB.find.run({ postID, userID, ...options }, pool);
}

export function getByIDs(ids: string[], options?: SortAndPaginationOpts) {
  return commentDB.find.run({ ids, ...options }, pool);
}

export async function getCommentTree(rootCommentID: string, depth: number = 4) {
  const commentTree = await commentDB.tree.run({ rootCommentID, depth }, pool);
  const commentIDs = commentTree.map((comment) => comment.id);
  return commentDB.find.run({ ids: commentIDs }, pool);
}

export function create(data: IInsertParams) {
  return commentDB.insert.run(data, pool);
}

export function edit(id: string, body: string) {
  return commentDB.update.run({ id, body }, pool);
}

export function remove(id: string) {
  return commentDB.remove.run({ ids: [id] }, pool);
}

export async function generateID() {
  let commentID;
  let IDTaken;
  do {
    commentID = nanoid(7);
    IDTaken = (await commentDB.find.run({ ids: [commentID] }, pool)).length;
  } while (IDTaken);
  return commentID;
}

export async function findMissingIDs(commentIDs: string[]) {
  const foundComments = await commentDB.find.run({ ids: commentIDs }, pool);
  const foundIDs = foundComments.map(({ id }) => id);
  const foundIDSet = new Set(foundIDs);
  return commentIDs.filter((id) => !foundIDSet.has(id));
}
