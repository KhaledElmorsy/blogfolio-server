const escape = (value: unknown): string => {
  switch (typeof value) {
    case 'number':
      return value.toString();
    case 'string':
      return `'${value}'`;
    default:
      return value === null ? 'null' : `'${value}`;
  }
};

type Table = Record<string, unknown>[];
type Schema = Record<string, Table>;
type TableColumnMask<T extends Schema> = Partial<{
  [t in keyof T]: { [c in keyof Partial<T[t][number]>]: boolean };
}>;

export default function generateDBInserts<T extends Schema>(
  data: T,
  tableOrder: (keyof T)[] = [],
  exclude: TableColumnMask<T> = {},
) {
  const statementMap: Record<keyof Schema, string> = {};

  Object.entries(data).forEach(([tableName, table]) => {
    const columns = Object.keys(table[0]).filter(
      (c) => !exclude[tableName]?.[c],
    );

    const valueStrings = table
      .map((row) => {
        const rowValues = columns.map((c) => row[c]);
        return rowValues.map(escape).join(', ');
      })
      .map((v) => `(${v})`)
      .join(', ');

    const statement = `INSERT INTO ${tableName} (${columns.join(
      ', ',
    )}) VALUES ${valueStrings};`;

    statementMap[tableName] = statement;
  });

  const statements = tableOrder.length
    ? tableOrder.map((name) => statementMap[name])
    : Object.values(statementMap);

  return statements.join('\n');
}
