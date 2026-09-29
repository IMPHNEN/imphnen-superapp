import { ACTIVITY_ACTION } from '@app/activity';
import { MENTORING_MESSAGE } from '@app/messages';
import type { TMentoringBookInput, TMentoringSession } from '@app/schemas';
import { Clock, Effect } from 'effect';
import {
  MentorRepo,
  mentorIsPublic,
  type TMentorRepoId,
} from '#/mentor/index.ts';
import { sessionActivityEntry } from '#/mentoring/application/session-activity.ts';
import { toSessionDto } from '#/mentoring/application/to-session-dto.ts';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EBadRequest, EConflict, type EDatabase } from '#/shared/errors.ts';

export const mentoringBook = Effect.fn('mentoringBook')(function* (
  input: TMentoringBookInput,
  menteeId: string
): Effect.fn.Return<
  TMentoringSession,
  EBadRequest | EConflict | EDatabase,
  TMentorRepoId | TMentoringSessionRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const sessionRepo = yield* MentoringSessionRepo;
  const activityRecorder = yield* ActivityRecorder;

  if (input.mentorUserId === menteeId) {
    return yield* new EBadRequest({ message: MENTORING_MESSAGE.SELF_BOOKING });
  }

  const now = yield* Clock.currentTimeMillis;

  if (new Date(input.scheduledAt).getTime() <= now) {
    return yield* new EBadRequest({
      message: MENTORING_MESSAGE.SCHEDULE_IN_PAST,
    });
  }

  const mentor = yield* mentorRepo.findByUserId(input.mentorUserId);

  if (mentor === null || !mentorIsPublic(mentor.status)) {
    return yield* new EBadRequest({
      message: MENTORING_MESSAGE.MENTOR_UNAVAILABLE,
    });
  }

  const row = yield* sessionRepo.book(input, menteeId);

  if (row === null) {
    return yield* new EConflict({
      message: MENTORING_MESSAGE.SCHEDULE_CONFLICT,
    });
  }

  yield* activityRecorder.insert(
    sessionActivityEntry(menteeId, ACTIVITY_ACTION.MENTORING_SESSION_BOOK, row)
  );

  return toSessionDto(row);
});
