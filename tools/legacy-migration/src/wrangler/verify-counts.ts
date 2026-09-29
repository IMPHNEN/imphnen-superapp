import { A, D } from '@mobily/ts-belt';
import type { TTargetTable } from '../target/target-table.ts';
import { sqlIdentifier, sqlLiteral } from '../load/sql-literal.ts';

export const FOREIGN_KEY_CHECK = 'PRAGMA foreign_key_check;';
const UNION = ' UNION ALL ';
const TABLE_COLUMN = 'table_name';
const COUNT_COLUMN = 'row_count';

export type TCountCheck = {
  readonly table: TTargetTable;
  readonly expected: number;
  readonly actual: number | null;
  readonly ok: boolean;
};

export const countQuery = (tables: readonly TTargetTable[]): string =>
  `${A.join(
    A.map(
      tables,
      (table): string =>
        `SELECT ${sqlLiteral(table)} AS ${TABLE_COLUMN}, count(*) AS ${COUNT_COLUMN} FROM ${sqlIdentifier(table)}`
    ),
    UNION
  )};`;

export const countsCompare = (
  expected: Readonly<Record<TTargetTable, number>>,
  rows: readonly Record<string, unknown>[]
): readonly TCountCheck[] => {
  const actual = new Map(
    A.map(rows, (row): [string, number] => [
      String(row[TABLE_COLUMN]),
      Number(row[COUNT_COLUMN]),
    ])
  );
  return A.map(
    D.toPairs(expected) as readonly (readonly [TTargetTable, number])[],
    ([table, count]): TCountCheck => {
      const found = actual.get(table) ?? null;
      return { table, expected: count, actual: found, ok: found === count };
    }
  );
};
