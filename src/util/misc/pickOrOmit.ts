function pickOrOmit<T extends object, K extends keyof T>(
  object: T,
  choice: K[]
): Pick<T, K>;
function pickOrOmit<T extends object, K extends keyof T>(
  object: T,
  choice: { pick: K[] }
): Pick<T, K>;
function pickOrOmit<T extends object, K extends keyof T>(
  object: T,
  choice: { omit: K[] }
): Omit<T, K>;
function pickOrOmit<T extends object, Key extends keyof T>(
  object: T,
  /** Pick array by default or an object with either `pick`|`omit` */
  choice: Key[] | { pick: Key[] } | { omit: Key[] },
) {
  const { pick: pickedProps = [], omit: omittedProps = [] } = (
    Array.isArray(choice) ? { pick: choice } : choice
  ) as { pick?: Key[]; omit?: Key[] };

  const pickSet = new Set(pickedProps);
  const omitSet = new Set(omittedProps);

  return Object.entries(object).reduce(
    (acc, [key, val]) =>
      (pickSet.has(key as Key) && !omitSet.has(key as Key)
        ? { ...acc, [key]: val }
        : acc),
    {},
  );
}

export function pick<T extends object>(object: T, props: (keyof T)[]) {
  return pickOrOmit(object, props);
}

export function omit<T extends object>(object: T, props: (keyof T)[]) {
  return pickOrOmit(object, { omit: props });
}
