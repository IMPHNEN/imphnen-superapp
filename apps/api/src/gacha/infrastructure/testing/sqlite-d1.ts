import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { A } from '@mobily/ts-belt';
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api';
import { Effect, Layer } from 'effect';
import { DbService, type TDbServiceId } from '#/platform/db/db-service.ts';
import { dbCreate, type TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  gachaClaim,
  gachaCredit,
  gachaItem,
} from '#/platform/db/tables/gacha.ts';

const IN_MEMORY = ':memory:';
const TRANSACTION = {
  BEGIN: 'BEGIN',
  COMMIT: 'COMMIT',
  ROLLBACK: 'ROLLBACK',
} as const;
const FOREIGN_KEYS_ON = 'PRAGMA foreign_keys = ON';

type TRows = Record<string, SQLInputValue>[];

type TD1Result = { results: TRows; success: boolean; meta: object };

type TStatement = {
  bind: (...params: SQLInputValue[]) => TStatement;
  rows: () => TRows;
  all: () => Promise<TD1Result>;
  run: () => Promise<TD1Result>;
  raw: () => Promise<SQLInputValue[][]>;
  first: () => Promise<Record<string, SQLInputValue> | null>;
};

const resultOf = (results: TRows): TD1Result => ({
  results,
  success: true,
  meta: {},
});

const statementOf = (
  database: DatabaseSync,
  query: string,
  params: readonly SQLInputValue[]
): TStatement => {
  const rows = (): TRows => database.prepare(query).all(...params) as TRows;
  return {
    bind: (...next: SQLInputValue[]): TStatement =>
      statementOf(database, query, next),
    rows,
    all: async (): Promise<TD1Result> => resultOf(rows()),
    run: async (): Promise<TD1Result> => resultOf(rows()),
    raw: async (): Promise<SQLInputValue[][]> => {
      const prepared = database.prepare(query);
      prepared.setReturnArrays(true);
      return prepared.all(...params) as unknown as SQLInputValue[][];
    },
    first: async (): Promise<Record<string, SQLInputValue> | null> =>
      rows()[0] ?? null,
  };
};

const batchRun = (
  database: DatabaseSync,
  statements: readonly TStatement[]
): TD1Result[] => {
  database.exec(TRANSACTION.BEGIN);
  try {
    const results = A.map(statements, (statement) =>
      resultOf(statement.rows())
    );
    database.exec(TRANSACTION.COMMIT);
    return [...results];
  } catch (cause) {
    database.exec(TRANSACTION.ROLLBACK);
    throw cause;
  }
};

const d1Of = (database: DatabaseSync): D1Database =>
  ({
    prepare: (query: string): TStatement => statementOf(database, query, []),
    batch: async (statements: readonly TStatement[]): Promise<TD1Result[]> =>
      batchRun(database, statements),
  }) as unknown as D1Database;

export type TSqliteDb = { db: TDb; database: DatabaseSync };

export const sqliteDbCreate = async (): Promise<TSqliteDb> => {
  const database = new DatabaseSync(IN_MEMORY);
  database.exec(FOREIGN_KEYS_ON);
  const empty = await generateSQLiteDrizzleJson({});
  const current = await generateSQLiteDrizzleJson({
    user,
    gachaItem,
    gachaCredit,
    gachaClaim,
  });
  const statements = await generateSQLiteMigration(empty, current);
  A.forEach(statements, (statement) => database.exec(statement));
  return { db: dbCreate(d1Of(database)), database };
};

export const sqliteDbLayer = (db: TDb): Layer.Layer<TDbServiceId> =>
  Layer.effect(DbService, Effect.succeed(DbService.of({ db })));
