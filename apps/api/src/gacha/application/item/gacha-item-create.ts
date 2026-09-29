import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import type { TGachaItem, TGachaItemCreateInput } from '@app/schemas';
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
import type { EConflict, EDatabase } from '#/shared/errors.ts';

export const gachaItemCreate = Effect.fn('gachaItemCreate')(function* (
  input: TGachaItemCreateInput,
  actorId: string
): Effect.fn.Return<
  TGachaItem,
  EConflict | EDatabase,
  TGachaItemRepoId | TActivityRecorderId
> {
  const repo = yield* GachaItemRepo;
  const activity = yield* ActivityRecorder;

  const row = yield* repo.create(input);
  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.GACHA_ITEM_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.GACHA_ITEM,
    resourceId: row.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.NAME]: row.name,
      [ACTIVITY_DETAIL.LABEL]: row.code,
    }),
  });

  return toGachaItemDto(row);
});
