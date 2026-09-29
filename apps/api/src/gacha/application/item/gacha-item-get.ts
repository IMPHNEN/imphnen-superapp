import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaItem, TGachaItemIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { toGachaItemDto } from '#/gacha/application/item/to-gacha-item-dto.ts';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
} from '#/gacha/domain/gacha-item.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const gachaItemGet = Effect.fn('gachaItemGet')(function* ({
  id,
}: TGachaItemIdInput): Effect.fn.Return<
  TGachaItem,
  ENotFound | EDatabase,
  TGachaItemRepoId
> {
  const repo = yield* GachaItemRepo;
  const row = yield* repo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: GACHA_MESSAGE.ITEM_NOT_FOUND });
  }

  return toGachaItemDto(row);
});
