import { expect, it, describe, test } from 'vitest';
import pickFields from '../pickFields';

it('Picks passed properties from an object', () => {
  const testObj = { name: 'Khaled', age: 29, likes: 'Cheese' };
  const strippedObj = pickFields.single(testObj, ['name', 'age']);
  expect(strippedObj).toStrictEqual({ name: 'Khaled', age: 29 });
});

it('Picks properties in each object in an array', () => {
  const testArr = [
    { name: 'Khaled', age: 29 },
    { name: 'Steve', age: 29 },
  ];
  const strippedArray = pickFields.array(testArr, ['name']);
  expect(strippedArray).toStrictEqual([{ name: 'Khaled' }, { name: 'Steve' }]);
});

describe('Options:', () => {
  describe('keepUndefined: (Array pick only)', () => {
    const heterogenous = [
      { name: 'Steve', age: 30, likes: 'Food' },
      { name: 'Bob', age: 20 },
      { name: 'John', age: 25, likes: 'Music' },
    ];
    test('true: Adds picked fields as undefined if not in input', () => {
      const strippedData = pickFields.array(heterogenous, ['name', 'likes'], {
        keepUndefined: true,
      });
      expect(strippedData).toStrictEqual([
        { name: 'Steve', likes: 'Food' },
        { name: 'Bob', likes: undefined },
        { name: 'John', likes: 'Music' },
      ]);
    });
    test('false: Excludes fields if not found in an object', () => {
      const strippedData = pickFields.array(heterogenous, ['name', 'likes'], {
        keepUndefined: false,
      });
      expect(strippedData).toStrictEqual([
        { name: 'Steve', likes: 'Food' },
        { name: 'Bob' },
        { name: 'John', likes: 'Music' },
      ]);
    });
  });
});
