function pickFields<T extends object, F extends keyof T>(
  object: T,
  feilds: F[],
  keepUndefined: boolean,
): { [K in F]: T[K] } {
  return feilds.reduce(
    (acc, field) =>
      (!keepUndefined && !Object.hasOwn(object, field)
        ? acc
        : { ...acc, [field]: object[field] }),
    {} as T,
  );
}

interface ArrayOptions {
  /**
   * In case of a heterogenous object array, include picked fields in
   * each object, setting values to `undefined` if the field isn't found in an
   * object.
   */
  keepUndefined?: boolean;
}

function pickSingle<T extends object, F extends keyof T>(
  object: T,
  fields: F[],
) {
  const uniqueFields = [...new Set(fields)];
  return pickFields(object, uniqueFields, false);
}

function pickArray<T extends object, F extends keyof T>(
  objects: T[],
  fields: F[],
  { keepUndefined = true }: ArrayOptions = {},
) {
  const uniqueFields = [...new Set(fields)];
  return objects.map((obj) => pickFields(obj, uniqueFields, keepUndefined));
}

export default {
  single: pickSingle,
  array: pickArray,
};
