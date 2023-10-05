interface Options {
  groupValues?: boolean;
}

/**
 * Given an array of homogenous objects and arrays of potential values for some of
 * the properties, return the property values that don't exist.
 *
 * @example
 * input = [
 *  {name: 'Khaled', level: 50},
 *  {name: 'Steve', level 34}
 * ];
 * fieldValues: {
 *  name: ['Khaled', 'Brian'],
 *  level: [31, 20]
 * }
 * output = [{name: 'Brian'}, {level: 31}, {level: 20}];
 * outputGrouped = {name: ['Brian'], level: [31, 20]}; // options.groupValues = true
 */
function getMissingFieldValues<
  T extends { [x in keyof T]: T[x] },
  F extends { [f in keyof Partial<T>]: T[f][] },
>(
  objects: T[],
  fields: F,
  options?: Options & { groupValues: false }
): (keyof F extends infer K
  ? K extends keyof F
    ? { [x in K]: T[K] }
    : never
  : never)[];
function getMissingFieldValues<
  T extends { [x in keyof T]: T[x] },
  F extends { [f in keyof Partial<T>]: T[f][] },
>(objects: T[], fields: F, options: Options & { groupValues: true }): F;
function getMissingFieldValues<
  T extends { [x in keyof T]: T[x] },
  F extends { [f in keyof Partial<T>]: T[f][] },
>(objects: T[], fields: F, { groupValues = false }: Options = {}) {
  type QueryField = keyof F;
  const fieldNames = Object.keys(fields) as QueryField[];
  const sets = fieldNames.reduce(
    (acc, field) => ({ ...acc, [field]: new Set() }),
    {} as { [x in QueryField]: Set<T[x]> },
  );
  objects.forEach((obj) => {
    fieldNames.forEach((field) => {
      sets[field].add(obj[field]);
    });
  });

  const missingFields = fieldNames.reduce(
    (acc, fieldName) => ({
      ...acc,
      [fieldName]: fields[fieldName].filter(
        (value) => !sets[fieldName].has(value as T[QueryField]),
      ),
    }),
    {} as F,
  );

  if (groupValues) return missingFields;
  return fieldNames.flatMap((fieldName) =>
    missingFields[fieldName].map((val) => ({ [fieldName]: val })),
  );
}

export default getMissingFieldValues;
