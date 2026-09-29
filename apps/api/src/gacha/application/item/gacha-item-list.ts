import type { TGachaItemList, TGachaItemListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toGachaItemDto } from '#/gacha/application/item/to-gacha-item-dto.ts';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
} from '#/gacha/domain/gacha-item.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const gachaItemList = Effect.fn('gachaItemList')(function* (
  input: TGachaItemListInput
): Effect.fn.Return<TGachaItemList, EDatabase, TGachaItemRepoId> {
  const repo = yield* GachaItemRepo;
  const { items, total } = yield* repo.list(input);
  return {
    items: A.map(items, toGachaItemDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
