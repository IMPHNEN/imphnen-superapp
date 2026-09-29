import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const qrCampaign = sqliteTable(
  'qr_campaign',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    name: text('name').notNull(),
    url: text('url').notNull(),
    qrImageKey: text('qr_image_key'),
    isActive: integer('is_active', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestampColumn('expires_at').notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('qr_campaign_single_active_idx')
      .on(table.isActive)
      .where(sql`${table.isActive} = 1`),
  ]
);
