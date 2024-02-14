import { it, expect, describe } from 'vitest';
import getUserQuery from '../getUserQuery';
import type { QueryFields, UserQueryParams } from '../getUserQuery';

describe('Query fields', () => {
  it.each([
    ['followerId', 'test'],
    ['followsId', 'test'],
    ['pk', 12],
    ['id', 'test'],
    ['searchAny', 'test'],
    ['searchUsername', 'test'],
  ] satisfies [keyof QueryFields, any][])(
    'Includes passed query properties in the output: %s',
    (key, value) => {
      const query = getUserQuery({ [key]: value } as any);
      expect(query[key]).toEqual(value);
    },
  );

  it('Throws if passed multiple query fields', () => {
    expect(() =>
      // @ts-ignore
      getUserQuery({ followerId: 'test', pk: 2 }),
    ).toThrow();
  });
});

const mockQuery = { pk: 1 } satisfies Partial<QueryFields>;

it('Includes passed field choices in output', () => {
  const fields: UserQueryParams['fields'] = ['firstName', 'bio', 'lastName'];
  expect(getUserQuery(mockQuery, { fields })).toEqual({ ...mockQuery, fields });
});

it('Splits and returns sorting fields as separate field and direction arrays', () => {
  const sort: UserQueryParams['sort'] = [
    { firstName: 'asc' },
    { lastName: 'desc' },
  ];
  const sortCols = ['firstName', 'lastName'];
  const sortDir = ['asc', 'desc'];
  expect(getUserQuery(mockQuery, { sort })).toEqual({
    ...mockQuery,
    sortCols,
    sortDir,
  });
});

it('Includes page limit in output', () => {
  const limit: UserQueryParams['limit'] = 99;
  expect(getUserQuery(mockQuery, { limit })).toEqual({ ...mockQuery, limit });
});

it('Includes next ID in output', () => {
  const nextId: UserQueryParams['nextId'] = 'test';
  expect(getUserQuery(mockQuery, { nextId })).toEqual({ ...mockQuery, nextId });
});
