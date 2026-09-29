import { A } from '@mobily/ts-belt';
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/d1';
import { Layer } from 'effect';
import type { TDb } from '#/platform/db/client.ts';
import { DbService, type TDbServiceId } from '#/platform/db/db-service.ts';
import * as schema from '#/platform/db/schema.ts';
import {
  memoryD1Create,
  type TMemoryD1,
} from '#/hackathon/infrastructure/testing/memory-d1.ts';

const STATEMENT_BREAKPOINT = '--> statement-breakpoint';

let ddlCache: readonly string[] | null = null;

const ddlBuild = async (): Promise<readonly string[]> => {
  const empty = await generateSQLiteDrizzleJson({});
  const current = await generateSQLiteDrizzleJson({ ...schema });
  const statements = await generateSQLiteMigration(empty, current);
  return A.flat(
    A.map(statements, (statement) => statement.split(STATEMENT_BREAKPOINT))
  );
};

export type TMemoryDb = TMemoryD1 & {
  readonly db: TDb;
  readonly layer: Layer.Layer<TDbServiceId>;
};

export const memoryDbCreate = async (): Promise<TMemoryDb> => {
  ddlCache ??= await ddlBuild();
  const memory = memoryD1Create(ddlCache);
  const db = drizzle(memory.d1, { schema });
  return {
    ...memory,
    db,
    layer: Layer.succeed(DbService, DbService.of({ db })),
  };
};
