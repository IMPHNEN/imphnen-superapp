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
  type EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepoId,
} from '#/hackathon/domain/join-request-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import {
  deadlineEnsure,
  leaderTeamFind,
} from '#/hackathon/application/hackathon-guards.ts';
import { joinOutcomeEnsure } from '#/hackathon/application/join-outcome-ensure.ts';

export const joinRequestRespond = Effect.fn('joinRequestRespond')(function* (
  input: THackathonDecisionInput,
  actorId: string
): Effect.fn.Return<
  THackathonDecisionResult,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TJoinRequestRepoId | TTeamRepoId
> {
  const joinRequestRepo = yield* JoinRequestRepo;
  const request = yield* joinRequestRepo.find(input.id);

  if (request === null) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.JOIN_REQUEST_NOT_FOUND,
    });
  }

  yield* leaderTeamFind(request.team.id, actorId);

  if (request.status !== HACKATHON_DECISION_STATUS.PENDING) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.JOIN_REQUEST_NOT_PENDING,
    });
  }

  if (!input.accept) {
    const rejected = yield* joinRequestRepo.reject(request.id);

    if (!rejected) {
      return yield* new EBadRequest({
        message: HACKATHON_MESSAGE.JOIN_REQUEST_NOT_PENDING,
      });
    }

    return { id: request.id, status: HACKATHON_DECISION_STATUS.REJECTED };
  }

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );

  const outcome = yield* joinRequestRepo.accept(request);
  yield* joinOutcomeEnsure(outcome, HACKATHON_MESSAGE.JOIN_REQUEST_NOT_PENDING);

  return { id: request.id, status: HACKATHON_DECISION_STATUS.ACCEPTED };
});
