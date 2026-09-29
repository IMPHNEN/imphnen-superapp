import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaItemIdInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
} from '#/gacha/domain/gacha-item.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const gachaItemDelete = Effect.fn('gachaItemDelete')(function* (
  { id }: TGachaItemIdInput,
  actorId: string
): Effect.fn.Return<
  { id: string },
  ENotFound | EDatabase,
  TGachaItemRepoId | TActivityRecorderId
> {
  const repo = yield* GachaItemRepo;
  const activity = yield* ActivityRecorder;

  const row = yield* repo.softDelete(id);

  if (row === null) {
    return yield* new ENotFound({ message: GACHA_MESSAGE.ITEM_NOT_FOUND });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.GACHA_ITEM_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.GACHA_ITEM,
    resourceId: row.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.NAME]: row.name,
      [ACTIVITY_DETAIL.LABEL]: row.code,
    }),
  });

  return { id: row.id };
});
