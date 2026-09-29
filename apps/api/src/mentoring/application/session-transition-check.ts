import { MENTORING_MESSAGE } from '@app/messages';
import type { TMentoringSessionStatus } from '@app/schemas';
import { Clock, Effect } from 'effect';
import type { TMentoringSessionRow } from '#/mentoring/domain/mentoring-session.ts';
import type { TSessionRole } from '#/mentoring/domain/session-actor.ts';
import {
  sessionRequiresStart,
  sessionRolesPermit,
  sessionTransitionRoles,
} from '#/mentoring/domain/session-status.ts';
import { EBadRequest, EConflict, EForbidden } from '#/shared/errors.ts';

export const sessionTransitionCheck = Effect.fn('sessionTransitionCheck')(
  function* (
    row: TMentoringSessionRow,
    roles: readonly TSessionRole[],
    to: TMentoringSessionStatus
  ): Effect.fn.Return<void, EConflict | EForbidden | EBadRequest> {
    const permitted = sessionTransitionRoles(row.status, to);

    if (permitted === undefined) {
      return yield* new EConflict({
        message: MENTORING_MESSAGE.TRANSITION_NOT_ALLOWED,
      });
    }

    if (!sessionRolesPermit(roles, permitted)) {
      return yield* new EForbidden({ message: MENTORING_MESSAGE.MENTOR_ONLY });
    }

    const now = yield* Clock.currentTimeMillis;

    if (sessionRequiresStart(to) && now < row.scheduledAt.getTime()) {
      return yield* new EBadRequest({ message: MENTORING_MESSAGE.NOT_STARTED });
    }
  }
);
