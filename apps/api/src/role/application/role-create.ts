import { ROLE_MESSAGE } from '@app/messages';
import type { TRoleCreateInput, TRoleDto } from '@app/schemas';
import { Effect } from 'effect';
import { roleExists } from '#/role/application/role-ensure.ts';
import { toRoleDto } from '#/role/application/to-role-dto.ts';
import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { A } from '@mobily/ts-belt';
import { EConflict, type EDatabase } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';

export const roleCreate = Effect.fn('roleCreate')(function* (
  input: TRoleCreateInput,
  actorId: string
): Effect.fn.Return<
  TRoleDto,
  EConflict | EDatabase,
  TCustomRoleRepoId | TActivityRecorderId
> {
  const customRoleRepo = yield* CustomRoleRepo;
  const activityRepo = yield* ActivityRecorder;

  const taken = yield* roleExists(input.key);

  if (taken) {
    return yield* new EConflict({ message: ROLE_MESSAGE.KEY_TAKEN });
  }

  const row = yield* customRoleRepo.create(input, actorId);
  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.ROLE_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.ROLE,
    resourceId: row.key,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.LABEL]: row.label,
      [ACTIVITY_DETAIL.PERMISSION_COUNT]: A.length(row.permissions),
    }),
  });

  return toRoleDto(row, {});
});
