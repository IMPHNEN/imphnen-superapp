import { USER_MESSAGE } from '@app/messages';
import type { TUser, TUserCreateInput } from '@app/schemas';
import { Effect } from 'effect';
import { roleEnsure } from '#/role/index.ts';
import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import {
  type EAuth,
  type EBadRequest,
  EConflict,
  type EDatabase,
} from '#/shared/errors.ts';
import { toUserDto } from '#/user/application/to-user-dto.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { TCustomRoleRepoId } from '#/role/index.ts';
import { UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userCreate = Effect.fn('userCreate')(function* (
  input: TUserCreateInput,
  actorId: string
): Effect.fn.Return<
  TUser,
  EConflict | EBadRequest | EDatabase | EAuth,
  TUserRepoId | TCustomRoleRepoId | TActivityRecorderId
> {
  const userRepo = yield* UserRepo;
  const activityRepo = yield* ActivityRecorder;

  yield* roleEnsure(input.role);

  const existing = yield* userRepo.findByEmail(input.email);

  if (existing !== null) {
    return yield* new EConflict({ message: USER_MESSAGE.EMAIL_TAKEN });
  }

  const row = yield* userRepo.create(input);
  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.USER_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.USER,
    resourceId: row.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: row.email,
      [ACTIVITY_DETAIL.ROLE]: row.role,
    }),
  });

  return toUserDto(row);
});
