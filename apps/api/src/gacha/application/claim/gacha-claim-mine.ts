import type { TGachaClaimMineInput, TGachaClaimMineList } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toGachaClaimDto } from '#/gacha/application/claim/to-gacha-claim-dto.ts';
import {
  GachaClaimRepo,
  type TGachaClaimRepoId,
} from '#/gacha/domain/gacha-claim.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const gachaClaimMine = Effect.fn('gachaClaimMine')(function* (
  input: TGachaClaimMineInput,
  userId: string
): Effect.fn.Return<TGachaClaimMineList, EDatabase, TGachaClaimRepoId> {
  const repo = yield* GachaClaimRepo;
  const { items, total } = yield* repo.listMine(userId, input);
  return {
    items: A.map(items, toGachaClaimDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
