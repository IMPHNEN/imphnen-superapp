import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  HACKATHON_DECISION_STATUS,
  type THackathonDecisionInput,
  type THackathonDecisionResult,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  EBadRequest,
  type EConflict,
  type EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import type { TSessionUser } from '#/shared/session.ts';
import {
  InvitationRepo,
  type TInvitationRepoId,
} from '#/hackathon/domain/invitation-repo.ts';
import { deadlineEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { joinOutcomeEnsure } from '#/hackathon/application/join-outcome-ensure.ts';

export const invitationRespond = Effect.fn('invitationRespond')(function* (
  input: THackathonDecisionInput,
  actor: TSessionUser
): Effect.fn.Return<
  THackathonDecisionResult,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TInvitationRepoId
> {
  const invitationRepo = yield* InvitationRepo;
  const invitation = yield* invitationRepo.find(input.id);

  if (invitation === null) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.INVITATION_NOT_FOUND,
    });
  }

  if (invitation.inviteeEmail !== actor.email.toLowerCase()) {
    return yield* new EForbidden({
      message: HACKATHON_MESSAGE.INVITATION_NOT_YOURS,
    });
  }

  if (invitation.status !== HACKATHON_DECISION_STATUS.PENDING) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.INVITATION_NOT_PENDING,
    });
  }

  if (!input.accept) {
    const rejected = yield* invitationRepo.reject(invitation.id);

    if (!rejected) {
      return yield* new EBadRequest({
        message: HACKATHON_MESSAGE.INVITATION_NOT_PENDING,
      });
    }

    return { id: invitation.id, status: HACKATHON_DECISION_STATUS.REJECTED };
  }

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );

  const outcome = yield* invitationRepo.accept(invitation, actor.id);
  yield* joinOutcomeEnsure(outcome, HACKATHON_MESSAGE.INVITATION_NOT_PENDING);

  return { id: invitation.id, status: HACKATHON_DECISION_STATUS.ACCEPTED };
});
