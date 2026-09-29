import { HACKATHON_MESSAGE } from '@app/messages';
import { HACKATHON_DEADLINE, HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { Effect } from 'effect';
import {
  EBadRequest,
  EConflict,
  type EDatabase,
  ENotFound,
} from '#/shared/errors.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import { deadlineEnsure } from '#/hackathon/application/hackathon-guards.ts';

export const memberRemoval = Effect.fn('memberRemoval')(function* (
  teamId: string,
  userId: string,
  leaderMessage: string
): Effect.fn.Return<
  void,
  EBadRequest | EConflict | ENotFound | EDatabase,
  TMembershipRepoId
> {
  const membershipRepo = yield* MembershipRepo;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );

  const membership = yield* membershipRepo.findByUser(userId);

  if (membership === null || membership.teamId !== teamId) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.MEMBER_NOT_FOUND,
    });
  }

  if (membership.role === HACKATHON_MEMBER_ROLE.LEADER) {
    return yield* new EBadRequest({ message: leaderMessage });
  }

  const removed = yield* membershipRepo.removeMember(teamId, userId);

  if (!removed) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.TEAM_LOCKED });
  }
});
