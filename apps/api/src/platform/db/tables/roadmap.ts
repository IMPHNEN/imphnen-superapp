import type { TRoadmapStatus } from '@app/schemas';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const roadmapItem = sqliteTable('roadmap_item', {
  id: text('id')
    .primaryKey()
    .$defaultFn((): string => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').$type<TRoadmapStatus>().notNull(),
  legacyVotes: integer('legacy_votes').notNull().default(0),
  deletedAt: timestampColumn('deleted_at'),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const roadmapVote = sqliteTable(
  'roadmap_vote',
  {
    itemId: text('item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.userId] }),
    index('roadmap_vote_user_idx').on(table.userId),
  ]
);
