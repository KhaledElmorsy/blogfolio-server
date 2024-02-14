import type { EndpointHelpers } from '@blogfolio/types/User';
import { users as usersDB } from '@/db';
import {
  user_sortable,
  sort_direction,
} from '@/db/queries/users/users.queries';
import type { OneProperty } from '@/util';

type IGetUsersParams = usersDB.IGetUsersParams;

export interface UserQueryParams {
  /** Fields to include in the result */
  fields?: EndpointHelpers['userFields']['fields'];
  /** Object defining the fields and directions to sort by */
  sort?: EndpointHelpers['sortFields']['sort'];
  /** Number of results to return */
  limit?: EndpointHelpers['pagination']['limit'];
  /** Public ID of the first user in the next page */
  nextId?: EndpointHelpers['pagination']['next'];
}

export type QueryFields = Pick<
IGetUsersParams,
'pk' | 'followsId' | 'followerId' | 'id' | 'searchAny' | 'searchUsername'
>;

export default function getUserQuery(
  query: OneProperty<QueryFields>,
  { fields, sort, nextId, limit }: UserQueryParams = {},
): IGetUsersParams {
  if (Object.keys(query).length > 1) {
    throw new Error(
      'Only one user query can be processed at a time by the DB query.',
    );
  }

  const sortCols = sort
    ? (sort.flatMap(Object.keys) as user_sortable[])
    : undefined;

  const sortDir = sort
    ? (sort.flatMap(Object.values) as sort_direction[])
    : undefined;

  return {
    /** Query */
    ...query,

    /** Pick fields */
    fields,

    /** Sort */
    sortCols,
    sortDir,

    /** Pagination */
    nextId,
    limit,
  };
}
