import { ACTIVITY_ACTION } from '@app/activity';
import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorPrivate, TMentorRegisterInput } from '@app/schemas';
import { Effect } from 'effect';
import { mentorActivityEntry } from '#/mentor/application/mentor-activity.ts';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import { mentorReapplyAllowed } from '#/mentor/domain/mentor-status.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EConflict, type EDatabase } from '#/shared/errors.ts';

export const mentorRegister = Effect.fn('mentorRegister')(function* (
  input: TMentorRegisterInput,
  userId: string
): Effect.fn.Return<
  TMentorPrivate,
  EConflict | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const activityRecorder = yield* ActivityRecorder;

  const existing = yield* mentorRepo.findByUserId(userId);

  if (existing !== null && !mentorReapplyAllowed(existing.status)) {
    return yield* new EConflict({ message: MENTOR_MESSAGE.ALREADY_APPLIED });
  }

  const row = yield* mentorRepo.register(input, userId);

  if (row === null) {
    return yield* new EConflict({ message: MENTOR_MESSAGE.ALREADY_APPLIED });
  }

  yield* activityRecorder.insert(
    mentorActivityEntry(userId, ACTIVITY_ACTION.MENTOR_REGISTER, row)
  );

  return toMentorPrivateDto(row);
});
