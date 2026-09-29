import { ACTIVITY_ACTION } from '@app/activity';
import { MENTORING_MESSAGE } from '@app/messages';
import {
  MENTORING_SESSION_STATUS,
  type TMentoringSession,
  type TMentoringSessionIdInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { sessionActivityEntry } from '#/mentoring/application/session-activity.ts';
import { sessionTransitionCheck } from '#/mentoring/application/session-transition-check.ts';
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
  type EBadRequest,
  EConflict,
  type EDatabase,
  type EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';

export const mentoringCancel = Effect.fn('mentoringCancel')(function* (
  { id }: TMentoringSessionIdInput,
  actor: TSessionActor
): Effect.fn.Return<
  TMentoringSession,
  ENotFound | EForbidden | EConflict | EBadRequest | EDatabase,
  TMentoringSessionRepoId | TActivityRecorderId
> {
  const sessionRepo = yield* MentoringSessionRepo;
  const activityRecorder = yield* ActivityRecorder;

  const { row, roles } = yield* sessionVisible(id, actor);
  yield* sessionTransitionCheck(row, roles, MENTORING_SESSION_STATUS.CANCELLED);

  const cancelled = yield* sessionRepo.change(row.id, row.status, {
    status: MENTORING_SESSION_STATUS.CANCELLED,
  });

  if (cancelled === null) {
    return yield* new EConflict({ message: MENTORING_MESSAGE.CHANGED });
  }

  yield* activityRecorder.insert(
    sessionActivityEntry(
      actor.userId,
      ACTIVITY_ACTION.MENTORING_SESSION_CANCEL,
      cancelled
    )
  );

  return toSessionDto(cancelled);
});
