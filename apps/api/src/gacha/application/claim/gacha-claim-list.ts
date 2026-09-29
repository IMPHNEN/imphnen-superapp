import type { TGachaClaimList, TGachaClaimListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toGachaClaimAdminDto } from '#/gacha/application/claim/to-gacha-claim-dto.ts';
import {
  GachaClaimRepo,
  type TGachaClaimRepoId,
} from '#/gacha/domain/gacha-claim.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const gachaClaimList = Effect.fn('gachaClaimList')(function* (
  input: TGachaClaimListInput
): Effect.fn.Return<TGachaClaimList, EDatabase, TGachaClaimRepoId> {
  const repo = yield* GachaClaimRepo;
  const { items, total } = yield* repo.list(input);
  return {
    items: A.map(items, toGachaClaimAdminDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
