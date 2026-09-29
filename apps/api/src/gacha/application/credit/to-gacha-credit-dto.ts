import { gachaCreditSchema, type TGachaCredit } from '@app/schemas';
import type { TGachaCreditRow } from '#/gacha/domain/gacha-credit.ts';

const EMPTY_BALANCE = 0;

export const toGachaCreditDto = (row: TGachaCreditRow): TGachaCredit =>
  gachaCreditSchema.parse({
    userId: row.userId,
    balance: row.balance,
    updatedAt: row.updatedAt.toISOString(),
  });

export const emptyGachaCreditDto = (userId: string): TGachaCredit =>
  gachaCreditSchema.parse({
    userId,
    balance: EMPTY_BALANCE,
    updatedAt: null,
  });
