import { USER_MESSAGE } from '@app/messages';
import type { TUserIdInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { type EDatabase, EForbidden, ENotFound } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userDelete = Effect.fn('userDelete')(function* (
  { id }: TUserIdInput,
  actorId: string
): Effect.fn.Return<
  { id: string },
  ENotFound | EForbidden | EDatabase,
  TUserRepoId | TActivityRecorderId
> {
  const userRepo = yield* UserRepo;
  const activityRepo = yield* ActivityRecorder;

  if (id === actorId) {
    return yield* new EForbidden({ message: USER_MESSAGE.SELF_DELETE });
  }

  const existing = yield* userRepo.findById(id);

  if (existing === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  const removed = yield* userRepo.remove(id);

  if (!removed) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.USER_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.USER,
    resourceId: id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: existing.email,
      [ACTIVITY_DETAIL.ROLE]: existing.role,
    }),
  });

  return { id };
});
