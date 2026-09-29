import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorPrivate, TMentorProfilePatch } from '@app/schemas';
import { Effect } from 'effect';
import { mentorPatchApply } from '#/mentor/application/mentor-patch.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import type { TActivityRecorderId } from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentorMeUpdate = Effect.fn('mentorMeUpdate')(function* (
  patch: TMentorProfilePatch,
  userId: string
): Effect.fn.Return<
  TMentorPrivate,
  ENotFound | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const row = yield* mentorRepo.findByUserId(userId);

  if (row === null) {
    return yield* new ENotFound({
      message: MENTOR_MESSAGE.APPLICATION_NOT_FOUND,
    });
  }

  return yield* mentorPatchApply(row, patch, userId);
});
