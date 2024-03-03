import { posts as postDB, pool } from '@/db';
import { nanoid } from 'nanoid';
import type * as PostQueries from '@/db/queries/posts/posts.queries';

export async function get(
  id: PostQueries.IFindParams['id'],
): Promise<PostQueries.IFindResult | undefined> {
  return (await postDB.find.run({ id }, pool))[0];
}

export async function getBySlug(
  slug: string,
  username: string,
): Promise<PostQueries.IFindResult | undefined> {
  return (await postDB.find.run({ slug, username }, pool))[0];
}

export function getByUsername(
  username: string,
  {
    searchTerm,
    limit,
    nextID,
    sortByDate = true,
  }: {
    searchTerm?: string;
    limit?: number;
    nextID?: string;
    sortByDate?: boolean;
  } = {},
) {
  return postDB.find.run(
    {
      username,
      visible: true,
      search: searchTerm,
      nextID,
      limit,
      recentFirst: sortByDate,
    },
    pool,
  );
}

export function getByUserID(
  userID: PostQueries.IFindParams['userID'],
  {
    searchTerm,
    limit,
    nextID,
    visible = true,
    sortByDate = true,
  }: {
    searchTerm?: string;
    limit?: number;
    nextID?: string;
    visible?: boolean;
    sortByDate?: boolean;
  } = {},
) {
  return postDB.find.run(
    {
      userID,
      search: searchTerm,
      limit,
      nextID,
      visible,
      recentFirst: sortByDate,
    },
    pool,
  );
}

export function search(
  query: string,
  {
    limit,
    nextID,
    sortByDate = false,
  }: { limit?: number; nextID?: string; sortByDate?: boolean } = {},
) {
  return postDB.find.run(
    { search: query, nextID, limit, visible: true, recentFirst: sortByDate },
    pool,
  );
}

export function addView(id: PostQueries.IAddViewParams['id']) {
  return postDB.addView.run({ id }, pool);
}

export function searchUserPosts(
  query: string,
  userID: string,
  {
    limit,
    nextID,
    sortByDate = true,
  }: { limit?: number; nextID?: string; sortByDate?: boolean } = {},
) {
  return postDB.find.run(
    {
      userID,
      search: query,
      nextID,
      limit,
      visible: true,
      recentFirst: sortByDate,
    },
    pool,
  );
}

export function create(details: PostQueries.IInsertParams) {
  return postDB.insert.run(details, pool);
}

export function update(
  id: string,
  updatedData: Omit<PostQueries.IUpdateParams, 'id'>,
) {
  return postDB.update.run({ id, ...updatedData }, pool);
}

export function remove(id: PostQueries.IRemoveParams['ids'][number]) {
  return postDB.remove.run({ ids: [id] }, pool);
}

export async function generateID() {
  let postID;
  let IDTaken;
  do {
    postID = nanoid(7);
    IDTaken = (await postDB.find.run({ id: postID }, pool)).length;
  } while (IDTaken);
  return postID;
}

export async function checkSlug(userID: string, slug: string) {
  const posts = await postDB.find.run({ userID, slug }, pool);
  return !posts.length;
}

export async function findMissingIDs(postIDs: string[]) {
  const foundIDs = (await postDB.checkIDs.run({ postIDs }, pool)).map(
    ({ id }) => id,
  );
  const foundIDSet = new Set(foundIDs);
  return postIDs.filter((id) => !foundIDSet.has(id));
}
