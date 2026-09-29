import { DEFAULT_ROLE } from '@app/permissions';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  role: text('role').notNull().default(DEFAULT_ROLE),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  deletedAt: timestampColumn('deleted_at'),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestampColumn('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestampColumn('access_token_expires_at'),
  refreshTokenExpiresAt: timestampColumn('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestampColumn('expires_at').notNull(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const rateLimit = sqliteTable('rate_limit', {
  id: text('id')
    .primaryKey()
    .$defaultFn((): string => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('last_request').notNull(),
});
