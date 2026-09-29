import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  HACKATHON_LIMIT,
  HACKATHON_TEAM_VISIBILITY,
  type THackathonJoinRequest,
  type THackathonJoinRequestCreateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  type EBadRequest,
  EConflict,
  type EDatabase,
  EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepoId,
} from '#/hackathon/domain/join-request-repo.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import {
  deadlineEnsure,
  teamFind,
} from '#/hackathon/application/hackathon-guards.ts';
import { toJoinRequestDto } from '#/hackathon/application/to-activity-dto.ts';

export const joinRequestCreate = Effect.fn('joinRequestCreate')(function* (
  input: THackathonJoinRequestCreateInput,
  actorId: string
): Effect.fn.Return<
  THackathonJoinRequest,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TMembershipRepoId | TJoinRequestRepoId | TStorageServiceId
> {
  const joinRequestRepo = yield* JoinRequestRepo;
  const membershipRepo = yield* MembershipRepo;
  const { publicUrlOf } = yield* StorageService;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );

  const team = yield* teamFind(input.teamId);

  if (team.visibility === HACKATHON_TEAM_VISIBILITY.PRIVATE) {
    return yield* new EForbidden({ message: HACKATHON_MESSAGE.TEAM_PRIVATE });
  }

  const membership = yield* membershipRepo.findByUser(actorId);

  if (membership !== null) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.ALREADY_IN_TEAM });
  }

  const state = yield* membershipRepo.teamState(input.teamId);

  if (state.hasSubmission) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.TEAM_LOCKED });
  }

  if (state.memberCount >= HACKATHON_LIMIT.TEAM_MAX_MEMBERS) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.TEAM_FULL });
  }

  const row = yield* joinRequestRepo.create({
    teamId: input.teamId,
    userId: actorId,
    message: input.message,
  });

  return toJoinRequestDto(row, publicUrlOf);
});
