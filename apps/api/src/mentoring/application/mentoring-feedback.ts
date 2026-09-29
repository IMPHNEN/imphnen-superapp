import { ACTIVITY_ACTION } from '@app/activity';
import { MENTORING_MESSAGE } from '@app/messages';
import {
  MENTORING_SESSION_STATUS,
  type TMentoringFeedbackInput,
  type TMentoringSession,
} from '@app/schemas';
import { Effect } from 'effect';
import { sessionActivityEntry } from '#/mentoring/application/session-activity.ts';
import { sessionVisible } from '#/mentoring/application/session-visible.ts';
import { toSessionDto } from '#/mentoring/application/to-session-dto.ts';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import type { TSessionActor } from '#/mentoring/domain/session-actor.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  EConflict,
  type EDatabase,
  EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';

export const mentoringFeedback = Effect.fn('mentoringFeedback')(function* (
  input: TMentoringFeedbackInput,
  actor: TSessionActor
): Effect.fn.Return<
  TMentoringSession,
  ENotFound | EForbidden | EConflict | EDatabase,
  TMentoringSessionRepoId | TActivityRecorderId
> {
  const sessionRepo = yield* MentoringSessionRepo;
  const activityRecorder = yield* ActivityRecorder;

  const { row } = yield* sessionVisible(input.id, actor);

  if (row.mentee.userId !== actor.userId) {
    return yield* new EForbidden({ message: MENTORING_MESSAGE.MENTEE_ONLY });
  }

  if (
    row.status !== MENTORING_SESSION_STATUS.COMPLETED ||
    row.feedbackSubmittedAt !== null
  ) {
    return yield* new EConflict({
      message: MENTORING_MESSAGE.FEEDBACK_NOT_ALLOWED,
    });
  }

  const updated = yield* sessionRepo.feedbackSet(input, actor.userId);

  if (updated === null) {
    return yield* new EConflict({
      message: MENTORING_MESSAGE.FEEDBACK_NOT_ALLOWED,
    });
  }

  yield* activityRecorder.insert(
    sessionActivityEntry(
      actor.userId,
      ACTIVITY_ACTION.MENTORING_SESSION_FEEDBACK,
      updated
    )
  );

  return toSessionDto(updated);
});
