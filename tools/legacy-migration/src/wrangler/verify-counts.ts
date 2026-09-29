import { A, D } from '@mobily/ts-belt';
import { sqlIdentifier } from '../load/sql-literal.ts';
import type { TTargetTable } from '../target/target-table.ts';

export const FOREIGN_KEY_CHECK = 'PRAGMA foreign_key_check;';
const SEPARATOR = ', ';

export type TCountCheck = {
  readonly table: TTargetTable;
  readonly expected: number;
  readonly actual: number | null;
  readonly ok: boolean;
};

export const countQuery = (tables: readonly TTargetTable[]): string =>
  `SELECT ${A.join(
    A.map(
      tables,
      (table): string =>
        `(SELECT count(*) FROM ${sqlIdentifier(table)}) AS ${sqlIdentifier(table)}`
    ),
    SEPARATOR
  )};`;

export const countsCompare = (
  expected: Readonly<Record<TTargetTable, number>>,
  counted: Readonly<Record<string, unknown>> | undefined
): readonly TCountCheck[] =>
  A.map(
    D.toPairs(expected) as readonly (readonly [TTargetTable, number])[],
    ([table, count]): TCountCheck => {
      const raw = counted?.[table];
      const actual = raw === undefined || raw === null ? null : Number(raw);
      return { table, expected: count, actual, ok: actual === count };
    }
  );
