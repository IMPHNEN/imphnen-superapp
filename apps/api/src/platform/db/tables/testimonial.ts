import type { TTestimonialStatus } from '@app/schemas';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const testimonial = sqliteTable(
  'testimonial',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    status: text('status').$type<TTestimonialStatus>().notNull(),
    reviewedBy: text('reviewed_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestampColumn('approved_at'),
    deletedAt: timestampColumn('deleted_at'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index('testimonial_status_idx').on(table.status),
    index('testimonial_user_idx').on(table.userId),
  ]
);
