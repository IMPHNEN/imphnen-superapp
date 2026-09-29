import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '#/platform/db/schema.ts';

export type TDb = DrizzleD1Database<typeof schema>;

export const dbCreate = (database: D1Database): TDb =>
  drizzle(database, { schema });
