import type { TGachaCredit } from '@app/schemas';
import { Effect } from 'effect';
import {
  emptyGachaCreditDto,
  toGachaCreditDto,
} from '#/gacha/application/credit/to-gacha-credit-dto.ts';
import {
  GachaCreditRepo,
  type TGachaCreditRepoId,
} from '#/gacha/domain/gacha-credit.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const gachaCreditMine = Effect.fn('gachaCreditMine')(function* (
  userId: string
): Effect.fn.Return<TGachaCredit, EDatabase, TGachaCreditRepoId> {
  const repo = yield* GachaCreditRepo;
  const row = yield* repo.findByUser(userId);
  return row === null ? emptyGachaCreditDto(userId) : toGachaCreditDto(row);
});
