import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorPrivate, TMentorUpdateInput } from '@app/schemas';
import { Effect } from 'effect';
import { mentorPatchApply } from '#/mentor/application/mentor-patch.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import type { TActivityRecorderId } from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentorUpdate = Effect.fn('mentorUpdate')(function* (
  input: TMentorUpdateInput,
  actorId: string
): Effect.fn.Return<
  TMentorPrivate,
  ENotFound | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const { id, ...patch } = input;
  const row = yield* mentorRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  return yield* mentorPatchApply(row, patch, actorId);
});
