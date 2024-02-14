/**
 * Pick object properties with defined values.
 * @example
 * input = {
 *  a: undefined,
 *  b: 10
 * };
 *
 * output = {
 *   b: 10
 * }
 */
export default function pickDefined<T extends { [key: string]: unknown }>(
  obj: T
): Partial<T> {
  return Object.entries(obj).reduce(
    (out, [key, value]) => (value !== undefined ? { out, [key]: value } : out),
    {}
  );
}
