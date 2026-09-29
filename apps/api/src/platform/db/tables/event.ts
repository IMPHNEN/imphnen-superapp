import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';

export const event = sqliteTable(
  'event',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description').notNull(),
    detailLink: text('detail_link').notNull(),
    price: integer('price').notNull().default(0),
    isOnline: integer('is_online', { mode: 'boolean' })
      .notNull()
      .default(false),
    location: text('location'),
    startDate: timestampColumn('start_date').notNull(),
    endDate: timestampColumn('end_date').notNull(),
    deletedAt: timestampColumn('deleted_at'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index('event_start_date_idx').on(table.startDate)]
);
