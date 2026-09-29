import { ACTIVITY_ACTION } from '@app/activity';
import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorIdInput, TMentorRemoved } from '@app/schemas';
import { Effect } from 'effect';
import { mentorActivityEntry } from '#/mentor/application/mentor-activity.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentorDelete = Effect.fn('mentorDelete')(function* (
  { id }: TMentorIdInput,
  actorId: string
): Effect.fn.Return<
  TMentorRemoved,
  ENotFound | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const activityRecorder = yield* ActivityRecorder;

  const row = yield* mentorRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  const removed = yield* mentorRepo.remove(id);

  if (!removed) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  yield* activityRecorder.insert(
    mentorActivityEntry(actorId, ACTIVITY_ACTION.MENTOR_DELETE, row)
  );

  return { id };
});
