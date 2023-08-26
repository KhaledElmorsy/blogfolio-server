export default function fieldIsNull<T>(
  data: T[],
  field: keyof T,
): boolean {
  return data.reduce((acc, obj) => acc && obj[field] === null, true);
}
