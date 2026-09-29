import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TTableRows } from '../pipeline/step-types.ts';
import type { TSqlRow } from '../target/target-rows.ts';
import { sqlIdentifier, sqlLiteral } from './sql-literal.ts';

export const SQL_LIMIT = {
  STATEMENT_BYTES: 90_000,
  D1_STATEMENT_BYTES: 100_000,
  ROWS_PER_STATEMENT: 50,
} as const;

const COLUMN_MISMATCH = 'rows of one table must share the same columns';
const STATEMENT_TOO_LARGE = 'a single row exceeds the D1 statement size limit';
const SEPARATOR = ', ';

const byteLength = (text: string): number => Buffer.byteLength(text);

const tuple = (row: TSqlRow, columns: readonly string[]): string =>
  `(${A.join(
    A.map(columns, (column): string => sqlLiteral(row[column] ?? null)),
    SEPARATOR
  )})`;

const headerOf = (table: string, columns: readonly string[]): string =>
  `INSERT INTO ${sqlIdentifier(table)} (${A.join(A.map(columns, sqlIdentifier), SEPARATOR)}) VALUES `;

const assertColumns = (
  table: string,
  rows: readonly TSqlRow[],
  columns: readonly string[]
): void => {
  const expected = A.join(
    A.sort(columns, (a, b): number => a.localeCompare(b)),
    SEPARATOR
  );
  const mismatch = A.find(
    rows,
    (row): boolean =>
      A.join(
        A.sort(D.keys(row), (a, b): number => a.localeCompare(b)),
        SEPARATOR
      ) !== expected
  );
  if (mismatch !== undefined && mismatch !== null) {
    throw new Error(`${COLUMN_MISMATCH}: ${table}`);
  }
};

type TPacking = {
  readonly statements: readonly string[];
  readonly current: readonly string[];
  readonly bytes: number;
};

const flush = (header: string, packing: TPacking): readonly string[] =>
  A.isEmpty(packing.current)
    ? packing.statements
    : A.append(
        packing.statements,
        `${header}${A.join(packing.current, SEPARATOR)};`
      );

const packRows = (
  entry: TTableRows,
  columns: readonly string[]
): readonly string[] => {
  assertColumns(entry.table, entry.rows, columns);
  const header = headerOf(entry.table, columns);
  const packed = A.reduce(
    A.map(entry.rows, (row): string => tuple(row, columns)),
    { statements: [], current: [], bytes: byteLength(header) } as TPacking,
    (acc, value): TPacking => {
      const size = byteLength(value) + SEPARATOR.length;
      if (byteLength(header) + size > SQL_LIMIT.D1_STATEMENT_BYTES) {
        throw new Error(
          `${STATEMENT_TOO_LARGE}: ${entry.table} ${value.slice(0, 80)}`
        );
      }
      const full =
        acc.current.length >= SQL_LIMIT.ROWS_PER_STATEMENT ||
        acc.bytes + size > SQL_LIMIT.STATEMENT_BYTES;
      return full
        ? {
            statements: flush(header, acc),
            current: [value],
            bytes: byteLength(header) + size,
          }
        : {
            statements: acc.statements,
            current: A.append(acc.current, value),
            bytes: acc.bytes + size,
          };
    }
  );
  return flush(header, packed);
};

export const insertStatements = (entry: TTableRows): readonly string[] =>
  match(A.head(entry.rows))
    .with(P.nullish, (): readonly string[] => [])
    .otherwise((first): readonly string[] =>
      packRows(entry, D.keys(first) as readonly string[])
    );
