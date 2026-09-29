import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  activityDetailList,
} from '@app/activity';
import { MENTORING_MESSAGE } from '@app/messages';
import type { TMentoringSession, TMentoringUpdateInput } from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { match, P } from 'ts-pattern';
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
  MEETING_LINK_EDITORS,
  sessionIsOpen,
  sessionRolesPermit,
} from '#/mentoring/domain/session-status.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  type EBadRequest,
  EConflict,
  type EDatabase,
  EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';

export const mentoringUpdate = Effect.fn('mentoringUpdate')(function* (
  input: TMentoringUpdateInput,
  actor: TSessionActor
): Effect.fn.Return<
  TMentoringSession,
  ENotFound | EForbidden | EConflict | EBadRequest | EDatabase,
  TMentoringSessionRepoId | TActivityRecorderId
> {
  const sessionRepo = yield* MentoringSessionRepo;
  const activityRecorder = yield* ActivityRecorder;
  const { id, ...change } = input;

  const { row, roles } = yield* sessionVisible(id, actor);
  const linkChanged = change.meetingLink !== undefined;

  if (linkChanged && !sessionRolesPermit(roles, MEETING_LINK_EDITORS)) {
    return yield* new EForbidden({ message: MENTORING_MESSAGE.MENTOR_ONLY });
  }

  if (linkChanged && !sessionIsOpen(change.status ?? row.status)) {
    return yield* new EConflict({
      message: MENTORING_MESSAGE.MEETING_LINK_LOCKED,
    });
  }

  yield* match(change.status)
    .with(P.nullish, () => Effect.void)
    .otherwise((to) => sessionTransitionCheck(row, roles, to));

  const updated = yield* sessionRepo.change(row.id, row.status, change);

  if (updated === null) {
    return yield* new EConflict({ message: MENTORING_MESSAGE.CHANGED });
  }

  yield* activityRecorder.insert(
    sessionActivityEntry(
      actor.userId,
      ACTIVITY_ACTION.MENTORING_SESSION_UPDATE,
      updated,
      {
        [ACTIVITY_DETAIL.CHANGED_FIELDS]: activityDetailList(D.keys(change)),
      }
    )
  );

  return toSessionDto(updated);
});
