import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { USER_MESSAGE } from '@app/messages';
import type { TUser, TUserActiveInput } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, EForbidden, ENotFound } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { toUserDto } from '#/user/application/to-user-dto.ts';
import { USER_FIELD, UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userActiveSet = Effect.fn('userActiveSet')(function* (
  input: TUserActiveInput,
  actorId: string
): Effect.fn.Return<
  TUser,
  ENotFound | EForbidden | EDatabase,
  TUserRepoId | TActivityRecorderId
> {
  const userRepo = yield* UserRepo;
  const activityRepo = yield* ActivityRecorder;

  if (input.id === actorId) {
    return yield* new EForbidden({ message: USER_MESSAGE.SELF_DEACTIVATE });
  }

  const updated = yield* userRepo.setActive(input);

  if (updated === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.USER_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.USER,
    resourceId: updated.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: updated.email,
      [ACTIVITY_DETAIL.CHANGED_FIELDS]: USER_FIELD.IS_ACTIVE,
    }),
  });

  return toUserDto(updated);
});
