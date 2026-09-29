import { sql } from 'drizzle-orm';
import { integer } from 'drizzle-orm/sqlite-core';

const NOW_MS = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const timestampColumn = (name: string) =>
  integer(name, { mode: 'timestamp_ms' });

export const createdAtColumn = () =>
  timestampColumn('created_at').notNull().default(NOW_MS);

export const updatedAtColumn = () =>
  timestampColumn('updated_at')
    .notNull()
    .default(NOW_MS)
    .$onUpdateFn((): Date => new Date());
