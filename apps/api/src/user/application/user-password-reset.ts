import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { USER_MESSAGE } from '@app/messages';
import type { TUserPasswordResetInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  type EAuth,
  type EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userPasswordReset = Effect.fn('userPasswordReset')(function* (
  input: TUserPasswordResetInput,
  actorId: string
): Effect.fn.Return<
  { id: string },
  ENotFound | EForbidden | EDatabase | EAuth,
  TUserRepoId | TActivityRecorderId
> {
  const userRepo = yield* UserRepo;
  const activityRepo = yield* ActivityRecorder;

  if (input.id === actorId) {
    return yield* new EForbidden({ message: USER_MESSAGE.SELF_PASSWORD_RESET });
  }

  const existing = yield* userRepo.findById(input.id);

  if (existing === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  yield* userRepo.resetPassword(input);
  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.USER_PASSWORD_RESET,
    resourceType: ACTIVITY_RESOURCE_TYPE.USER,
    resourceId: input.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: existing.email,
    }),
  });

  return { id: input.id };
});
