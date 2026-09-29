import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAtColumn } from '#/platform/db/columns/timestamps.ts';

export const activityLog = sqliteTable(
  'activity_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('activity_log_resource_idx').on(table.resourceType, table.resourceId),
    index('activity_log_actor_id_idx').on(table.actorId),
    index('activity_log_created_at_idx').on(table.createdAt),
  ]
);
