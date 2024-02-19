export type PropOfValueType<T, V> = {
  [k in keyof T as T[k] extends V ? k : never]: T[k];
};

export type KeyOfValueType<T, V> = keyof PropOfValueType<T, V> & keyof T;

// https://github.com/microsoft/TypeScript/issues/15300
export type IndexInterface<T> = Pick<T, keyof T>;

export type Invert<
  T extends Record<string | number | symbol, string | number | symbol>,
> = {
  [v in T[keyof T]]: {
    [k in keyof T]: T[k] extends v ? k : never;
  } extends infer I
    ? I[keyof I]
    : never;
};

export type PickValues<T, V extends T[keyof T]> = {
  [k in keyof T as T[k] extends V ? k : never]: T[k];
};

export type DecrementMax10 = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type GetKeyType<T extends object | unknown[] | readonly unknown[]> =
  T extends unknown[]
    ? number
    : T extends readonly unknown[]
      ? Exclude<keyof T, keyof []>
      : keyof T;

export type PathArray<T extends object, D extends number = 10> = D extends never
  ? []
  : GetKeyType<T> extends infer K
    ? K extends keyof T
      ?
      | [K]
      | (T[K] extends infer Child
        ? Child extends object
          ? [K, ...PathArray<Child, DecrementMax10[D]>]
          : never
        : never)
      : never
    : never;

/**
 * Force an object type that can have different potential properties to be only 
 * able to have only one of those properties when defined.
 *
 * Inspiration & logic: https://stackoverflow.com/a/57576688/17804016 
 * @example
 * interface Foo{
 *  a?: string;
 *  b?: string
 * };
 * const OneProperty<fooTest> = {a: 'woot'} // type {a: string, b: never}
 */
export type OneProperty<T extends object, K = keyof T> = Partial<T> & (K extends keyof T
  ? { [x in K]: T[K] } & Partial<{
    [x in Exclude<keyof T, K>]: [never, 'Only one property can be passed'];
  }>
  : never);
