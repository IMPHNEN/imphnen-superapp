import {
  GACHA_ITEM_DESCRIPTION_EMPTY,
  type TGachaClaimSource,
  type TGachaClaimStatus,
  type TGachaMetadata,
} from '@app/schemas';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const gachaItem = sqliteTable(
  'gacha_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description')
      .notNull()
      .default(GACHA_ITEM_DESCRIPTION_EMPTY),
    rarity: text('rarity').notNull(),
    type: text('type').notNull(),
    category: text('category').notNull(),
    value: integer('value').notNull().default(0),
    weight: real('weight').notNull(),
    stock: integer('stock').notNull(),
    isLimited: integer('is_limited', { mode: 'boolean' })
      .notNull()
      .default(false),
    metadata: text('metadata', { mode: 'json' }).$type<TGachaMetadata>(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestampColumn('deleted_at'),
  },
  (table) => [
    check('gacha_item_stock_check', sql`${table.stock} >= 0`),
    check('gacha_item_weight_check', sql`${table.weight} >= 0`),
    index('gacha_item_deleted_at_idx').on(table.deletedAt),
  ]
);

export const gachaCredit = sqliteTable(
  'gacha_credit',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    balance: integer('balance').notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [check('gacha_credit_balance_check', sql`${table.balance} >= 0`)]
);

export const gachaClaim = sqliteTable(
  'gacha_claim',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    itemId: text('item_id')
      .notNull()
      .references(() => gachaItem.id, { onDelete: 'restrict' }),
    source: text('source').$type<TGachaClaimSource>().notNull(),
    status: text('status').$type<TGachaClaimStatus>().notNull(),
    quantity: integer('quantity').notNull().default(1),
    fulfilledAt: timestampColumn('fulfilled_at'),
    fulfilledBy: text('fulfilled_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    check('gacha_claim_quantity_check', sql`${table.quantity} >= 1`),
    index('gacha_claim_user_id_idx').on(table.userId, table.createdAt),
    index('gacha_claim_item_id_idx').on(table.itemId),
    index('gacha_claim_status_idx').on(table.status, table.createdAt),
  ]
);
