import { it, expect, describe } from 'vitest';
import fieldValuesMatch from '../fieldValuesMatch';

const inputData = [
  { name: 'Khaled', level: 99, likes: 'sushi' },
  { name: 'Bob', level: 99, likes: 'pizza' },
  { name: 'Steve', level: 89, likes: 'salmon' },
];

const targetData = [
  { user_name: 'Khaled', user_level: null, user_favourite_food: 'sushi' },
  { user_name: 'Bob', user_level: 99, user_favourite_food: 'pizza' },
  { user_name: 'Steve', user_level: null, user_favourite_food: 'salmon' },
];

it('Returns true if fields match', () => {
  expect(
    fieldValuesMatch({
      inputData,
      inputKey: 'name',
      targetData,
      targetKey: 'user_name',
      fieldMap: {
        likes: 'user_favourite_food',
      },
    }),
  ).toBe(true);
});

it("Returns false if any field doesn't match", () => {
  expect(
    fieldValuesMatch({
      targetData,
      inputData,
      inputKey: 'name',
      targetKey: 'user_name',
      fieldMap: {
        likes: 'user_favourite_food',
        level: 'user_level',
      },
    }),
  ).toBe(false);
});

describe('Invalid input handling:', () => {
  it("Throws when key fields aren't the same type ", async () => {
    expect(() =>
      fieldValuesMatch({
        targetData: [{ id: 213 }],
        inputData: [{ id: '213' }],
        // @ts-ignore
        inputKey: 'id',
        // @ts-ignore
        targetKey: 'id',
        fieldMap: {
          id: 'id',
        },
      }),
    ).toThrow();
  });

  it('Throws when the input data set is larger than the target data set', () => {
    expect(() =>
      fieldValuesMatch({
        inputData: [{ id: 1 }, { id: 2 }, { id: 3 }],
        targetData: [{ id: 1 }, { id: 2 }],
        inputKey: 'id',
        targetKey: 'id',
        fieldMap: {
          id: 'id',
        },
      }),
    ).toThrow();
  });

  it("Throws when input key values aren't in the target data", () => {
    expect(() =>
      fieldValuesMatch({
        inputData: [{ id: 2 }, { id: 4 }],
        targetData: [{ id: 2 }, { id: 5 }],
        inputKey: 'id',
        targetKey: 'id',
        fieldMap: {
          id: 'id',
        },
      }),
    ).toThrow();
  });
});
