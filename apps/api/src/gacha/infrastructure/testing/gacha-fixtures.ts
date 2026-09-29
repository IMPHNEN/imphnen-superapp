import type { TGachaItemCreateInput } from '@app/schemas';
import { eq } from 'drizzle-orm';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  gachaClaim,
  gachaCredit,
  gachaItem,
} from '#/platform/db/tables/gacha.ts';

export const FIXTURE_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Roller',
  email: 'roller@test.app',
} as const;

export const FIXTURE_OTHER_USER = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Other',
  email: 'other@test.app',
} as const;

export const itemInput = (
  overrides: Partial<TGachaItemCreateInput> = {}
): TGachaItemCreateInput => ({
  code: 'pin',
  name: 'Pin',
  description: 'Enamel pin',
  rarity: 'common',
  type: 'physical',
  category: 'merchandise',
  value: 0,
  weight: 1,
  stock: 5,
  isLimited: false,
  metadata: null,
  ...overrides,
});

export const usersSeed = async (db: TDb): Promise<void> => {
  await db.insert(user).values([FIXTURE_USER, FIXTURE_OTHER_USER]);
};

export const itemSeed = async (
  db: TDb,
  overrides: Partial<TGachaItemCreateInput> = {}
): Promise<string> => {
  const [row] = await db
    .insert(gachaItem)
    .values(itemInput(overrides))
    .returning({ id: gachaItem.id });
  return row?.id ?? '';
};

export const creditSeed = async (
  db: TDb,
  userId: string,
  balance: number
): Promise<void> => {
  await db.insert(gachaCredit).values({ userId, balance });
};

export const balanceOf = async (db: TDb, userId: string): Promise<number> => {
  const [row] = await db
    .select({ balance: gachaCredit.balance })
    .from(gachaCredit)
    .where(eq(gachaCredit.userId, userId));
  return row?.balance ?? 0;
};

export const stockOf = async (db: TDb, itemId: string): Promise<number> => {
  const [row] = await db
    .select({ stock: gachaItem.stock })
    .from(gachaItem)
    .where(eq(gachaItem.id, itemId));
  return row?.stock ?? 0;
};

export const claimCountOf = async (db: TDb, userId: string): Promise<number> =>
  (await db.select().from(gachaClaim).where(eq(gachaClaim.userId, userId)))
    .length;
