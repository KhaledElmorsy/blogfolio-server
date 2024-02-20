export function pick<T extends object, D extends keyof T>(
  object: T,
  props: D[],
) {
  const picked = new Set(props);
  return (Object.keys(object) as D[]).reduce(
    (acc, key) => (picked.has(key) ? { ...acc, [key]: object[key] } : acc),
    {} as Pick<T, D>,
  );
}

export function omit<T extends object, D extends keyof T>(
  object: T,
  props: D[],
) {
  const omitted = new Set(props);
  return (Object.keys(object) as D[]).reduce(
    (acc, key) => (omitted.has(key) ? acc : { ...acc, [key]: object[key] }),
    {} as Omit<T, D>,
  );
}
