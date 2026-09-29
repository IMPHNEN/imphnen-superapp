import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonDeadline } from '@app/schemas';
import { Clock, Effect } from 'effect';
import {
  EBadRequest,
  type EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import type {
  TMembershipRow,
  TTeamRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';

export const deadlineEnsure = Effect.fn('deadlineEnsure')(function* (
  deadline: THackathonDeadline,
  message: string
): Effect.fn.Return<void, EBadRequest> {
  const now = yield* Clock.currentTimeMillis;

  if (now >= Date.parse(deadline)) {
    return yield* new EBadRequest({ message });
  }
});

export const teamFind = Effect.fn('teamFind')(function* (
  teamId: string
): Effect.fn.Return<TTeamRow, ENotFound | EDatabase, TTeamRepoId> {
  const teamRepo = yield* TeamRepo;
  const team = yield* teamRepo.find(teamId);

  if (team === null) {
    return yield* new ENotFound({ message: HACKATHON_MESSAGE.TEAM_NOT_FOUND });
  }

  return team;
});

export const leaderTeamFind = Effect.fn('leaderTeamFind')(function* (
  teamId: string,
  userId: string
): Effect.fn.Return<TTeamRow, ENotFound | EForbidden | EDatabase, TTeamRepoId> {
  const team = yield* teamFind(teamId);

  if (team.leaderId !== userId) {
    return yield* new EForbidden({ message: HACKATHON_MESSAGE.NOT_LEADER });
  }

  return team;
});

export const membershipEnsure = Effect.fn('membershipEnsure')(function* (
  teamId: string,
  userId: string
): Effect.fn.Return<TMembershipRow, EForbidden | EDatabase, TMembershipRepoId> {
  const membershipRepo = yield* MembershipRepo;
  const membership = yield* membershipRepo.findByUser(userId);

  if (membership === null || membership.teamId !== teamId) {
    return yield* new EForbidden({ message: HACKATHON_MESSAGE.NOT_MEMBER });
  }

  return membership;
});
