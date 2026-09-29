import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaClaimAdmin, TGachaClaimIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { toGachaClaimAdminDto } from '#/gacha/application/claim/to-gacha-claim-dto.ts';
import {
  GachaClaimRepo,
  type TGachaClaimRepoId,
} from '#/gacha/domain/gacha-claim.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EConflict, type EDatabase, ENotFound } from '#/shared/errors.ts';

export const gachaClaimFulfil = Effect.fn('gachaClaimFulfil')(function* (
  { id }: TGachaClaimIdInput,
  actorId: string
): Effect.fn.Return<
  TGachaClaimAdmin,
  ENotFound | EConflict | EDatabase,
  TGachaClaimRepoId | TActivityRecorderId
> {
  const repo = yield* GachaClaimRepo;
  const activity = yield* ActivityRecorder;

  const fulfilled = yield* repo.fulfil(id, actorId);
  const row = yield* repo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: GACHA_MESSAGE.CLAIM_NOT_FOUND });
  }

  if (!fulfilled) {
    return yield* new EConflict({
      message: GACHA_MESSAGE.CLAIM_ALREADY_FULFILLED,
    });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.GACHA_CLAIM_FULFIL,
    resourceType: ACTIVITY_RESOURCE_TYPE.GACHA_CLAIM,
    resourceId: row.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: row.user.email,
      [ACTIVITY_DETAIL.NAME]: row.item.name,
    }),
  });

  return toGachaClaimAdminDto(row);
});
