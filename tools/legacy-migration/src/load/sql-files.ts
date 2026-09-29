import { A } from '@mobily/ts-belt';
import type { TTableRows } from '../pipeline/step-types.ts';
import type { TTargetTable } from '../target/target-table.ts';
import { sqlIdentifier } from './sql-literal.ts';
import { insertStatements } from './sql-statements.ts';

export const SQL_FILE_LIMIT = {
  BYTES: 2_000_000,
  STATEMENTS: 400,
} as const;

export const DEFER_FOREIGN_KEYS = 'PRAGMA defer_foreign_keys = true;';
const NEWLINE = '\n';
const EXTENSION = '.sql';
const NAME_SEPARATOR = '-';
const INDEX_WIDTH = 4;
const PAD = '0';
export const RESET_FILE = 'reset.sql';

export type TSqlFile = {
  readonly name: string;
  readonly table: TTargetTable;
  readonly statements: number;
  readonly content: string;
};

type TChunk = readonly string[];

type TPart = {
  readonly table: TTargetTable;
  readonly part: number;
  readonly chunk: TChunk;
};

type TChunking = { readonly chunks: readonly TChunk[]; readonly bytes: number };

const chunkStep = (acc: TChunking, statement: string): TChunking => {
  const size = Buffer.byteLength(statement) + NEWLINE.length;
  const last = A.last(acc.chunks);
  const fits =
    last !== undefined &&
    last !== null &&
    last.length < SQL_FILE_LIMIT.STATEMENTS &&
    acc.bytes + size < SQL_FILE_LIMIT.BYTES;
  return fits
    ? {
        chunks: A.append(A.initOrEmpty(acc.chunks), A.append(last, statement)),
        bytes: acc.bytes + size,
      }
    : { chunks: A.append(acc.chunks, [statement]), bytes: size };
};

const chunked = (statements: readonly string[]): readonly TChunk[] =>
  A.reduce(statements, { chunks: [], bytes: 0 } as TChunking, chunkStep).chunks;

const fileName = (index: number, table: string, part: number): string =>
  `${String(index).padStart(INDEX_WIDTH, PAD)}${NAME_SEPARATOR}${table}${NAME_SEPARATOR}${part}${EXTENSION}`;

export const sqlFilesBuild = (
  tables: readonly TTableRows[]
): readonly TSqlFile[] => {
  const perTable = A.flat(
    A.map(tables, (entry): readonly TPart[] =>
      A.mapWithIndex(
        chunked(insertStatements(entry)),
        (part, chunk): TPart => ({
          table: entry.table,
          part: part + 1,
          chunk,
        })
      )
    )
  );
  return A.mapWithIndex(
    perTable,
    (index, item): TSqlFile => ({
      name: fileName(index + 1, item.table, item.part),
      table: item.table,
      statements: item.chunk.length,
      content: `${A.join(A.prepend(item.chunk, DEFER_FOREIGN_KEYS), NEWLINE)}${NEWLINE}`,
    })
  );
};

export const resetSqlBuild = (tables: readonly TTableRows[]): string =>
  `${A.join(
    A.prepend(
      A.map(
        A.reverse(tables),
        (entry): string => `DELETE FROM ${sqlIdentifier(entry.table)};`
      ),
      DEFER_FOREIGN_KEYS
    ),
    NEWLINE
  )}${NEWLINE}`;
