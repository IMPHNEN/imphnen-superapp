import { ROLE_MESSAGE } from '@app/messages';
import { isRole } from '@app/permissions';
import type { TRoleKeyInput } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import {
  EBadRequest,
  EConflict,
  type EDatabase,
  ENotFound,
} from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';

export const roleDelete = Effect.fn('roleDelete')(function* (
  { key }: TRoleKeyInput,
  actorId: string
): Effect.fn.Return<
  { key: string },
  ENotFound | EBadRequest | EConflict | EDatabase,
  TCustomRoleRepoId | TActivityRecorderId
> {
  const customRoleRepo = yield* CustomRoleRepo;
  const activityRepo = yield* ActivityRecorder;

  if (isRole(key)) {
    return yield* new EBadRequest({ message: ROLE_MESSAGE.FIXED });
  }

  const found = yield* customRoleRepo.findByKey(key);

  if (found === null) {
    return yield* new ENotFound({ message: ROLE_MESSAGE.NOT_FOUND });
  }

  const counts = yield* customRoleRepo.memberCounts();

  if ((D.get(counts, key) ?? 0) > 0) {
    return yield* new EConflict({ message: ROLE_MESSAGE.IN_USE });
  }

  yield* customRoleRepo.remove(key);

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.ROLE_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.ROLE,
    resourceId: key,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.LABEL]: found.label,
      [ACTIVITY_DETAIL.PERMISSION_COUNT]: A.length(found.permissions),
    }),
  });

  return { key };
});
