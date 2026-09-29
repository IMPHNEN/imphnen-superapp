import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';

type TRow = Record<string, SQLInputValue>;

type TBound = {
  readonly sql: string;
  readonly params: readonly SQLInputValue[];
};

const SQL_BEGIN = 'BEGIN';
const SQL_COMMIT = 'COMMIT';
const SQL_ROLLBACK = 'ROLLBACK';

const paramOf = (value: unknown): SQLInputValue =>
  match(value)
    .with(P.boolean, (flag): number => (flag ? 1 : 0))
    .with(P.nullish, (): null => null)
    .otherwise((other): SQLInputValue => other as SQLInputValue);

const rowsOf = (database: DatabaseSync, bound: TBound): TRow[] =>
  database.prepare(bound.sql).all(...bound.params) as TRow[];

const arraysOf = (database: DatabaseSync, bound: TBound): unknown[][] => {
  const statement = database.prepare(bound.sql);
  statement.setReturnArrays(true);
  return statement.all(...bound.params) as unknown as unknown[][];
};

const resultOf = (database: DatabaseSync, bound: TBound): D1Result => {
  const statement = database.prepare(bound.sql);
  const returnsRows = A.isNotEmpty(statement.columns());
  const results = returnsRows ? (statement.all(...bound.params) as TRow[]) : [];
  const changes = returnsRows
    ? A.length(results)
    : Number(statement.run(...bound.params).changes);
  return { results, success: true, meta: { changes } } as unknown as D1Result;
};

const statementOf = (
  database: DatabaseSync,
  bound: TBound
): D1PreparedStatement =>
  ({
    bound,
    bind: (...params: unknown[]): D1PreparedStatement =>
      statementOf(database, { sql: bound.sql, params: A.map(params, paramOf) }),
    all: async (): Promise<D1Result> => resultOf(database, bound),
    run: async (): Promise<D1Result> => resultOf(database, bound),
    raw: async (): Promise<unknown[][]> => arraysOf(database, bound),
    first: async (): Promise<TRow | null> => rowsOf(database, bound)[0] ?? null,
  }) as unknown as D1PreparedStatement;

const batchRun = (
  database: DatabaseSync,
  statements: D1PreparedStatement[]
): D1Result[] => {
  database.exec(SQL_BEGIN);
  try {
    const results = A.map(statements, (statement) =>
      resultOf(database, (statement as unknown as { bound: TBound }).bound)
    );
    database.exec(SQL_COMMIT);
    return [...results];
  } catch (error) {
    database.exec(SQL_ROLLBACK);
    throw error;
  }
};

export type TMemoryD1 = {
  readonly d1: D1Database;
  readonly sqlite: DatabaseSync;
};

export const memoryD1Create = (ddl: readonly string[]): TMemoryD1 => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  A.forEach(ddl, (statement) => sqlite.exec(statement));
  const d1 = {
    prepare: (sql: string): D1PreparedStatement =>
      statementOf(sqlite, { sql, params: [] }),
    batch: async (statements: D1PreparedStatement[]): Promise<D1Result[]> =>
      batchRun(sqlite, statements),
    exec: async (sql: string): Promise<D1ExecResult> => {
      sqlite.exec(sql);
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;
  return { d1, sqlite };
};
