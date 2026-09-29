import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { A } from '@mobily/ts-belt';
import { MIGRATIONS_DIR } from '../config/paths.ts';

const IN_MEMORY = ':memory:';
const ENCODING = 'utf8';
const SQL_EXTENSION = '.sql';
const BREAKPOINT = '--> statement-breakpoint';
const FOREIGN_KEYS_ON = 'PRAGMA foreign_keys = ON;';
const BEGIN = 'BEGIN;';
const COMMIT = 'COMMIT;';
const ROLLBACK = 'ROLLBACK;';

export const migrationFiles = (): readonly string[] =>
  A.sort(
    A.filter(readdirSync(MIGRATIONS_DIR), (name): boolean =>
      name.endsWith(SQL_EXTENSION)
    ),
    (left, right): number => left.localeCompare(right)
  );

export const rehearsalDatabase = (): DatabaseSync => {
  const database = new DatabaseSync(IN_MEMORY);
  A.forEach(migrationFiles(), (name): void =>
    database.exec(
      readFileSync(join(MIGRATIONS_DIR, name), ENCODING).replaceAll(
        BREAKPOINT,
        ''
      )
    )
  );
  database.exec(FOREIGN_KEYS_ON);
  return database;
};

export const d1LikeApply = (database: DatabaseSync, content: string): void => {
  database.exec(BEGIN);
  try {
    database.exec(content);
    database.exec(COMMIT);
  } catch (error) {
    database.exec(ROLLBACK);
    throw error;
  }
};
