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
