import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetailList,
  activityDetails,
} from '@app/activity';
import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaItem, TGachaItemUpdateInput } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toGachaItemDto } from '#/gacha/application/item/to-gacha-item-dto.ts';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
} from '#/gacha/domain/gacha-item.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EConflict, type EDatabase, ENotFound } from '#/shared/errors.ts';

const ID_FIELD = 'id';

const changedFieldsOf = (input: TGachaItemUpdateInput): readonly string[] =>
  A.reject(
    D.keys(D.filter(input, (value): boolean => value !== undefined)),
    (key): boolean => key === ID_FIELD
  );

export const gachaItemUpdate = Effect.fn('gachaItemUpdate')(function* (
  input: TGachaItemUpdateInput,
  actorId: string
): Effect.fn.Return<
  TGachaItem,
  ENotFound | EConflict | EDatabase,
  TGachaItemRepoId | TActivityRecorderId
> {
  const repo = yield* GachaItemRepo;
  const activity = yield* ActivityRecorder;

  const row = yield* repo.update(input);

  if (row === null) {
    return yield* new ENotFound({ message: GACHA_MESSAGE.ITEM_NOT_FOUND });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.GACHA_ITEM_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.GACHA_ITEM,
    resourceId: row.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.NAME]: row.name,
      [ACTIVITY_DETAIL.CHANGED_FIELDS]: activityDetailList(
        changedFieldsOf(input)
      ),
    }),
  });

  return toGachaItemDto(row);
});
