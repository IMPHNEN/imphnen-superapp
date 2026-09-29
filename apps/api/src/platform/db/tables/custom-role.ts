import type { TPermission } from '@app/permissions';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const customRole = sqliteTable('custom_role', {
  id: text('id')
    .primaryKey()
    .$defaultFn((): string => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description'),
  permissions: text('permissions', { mode: 'json' })
    .$type<readonly TPermission[]>()
    .notNull()
    .default([]),
  createdBy: text('created_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
