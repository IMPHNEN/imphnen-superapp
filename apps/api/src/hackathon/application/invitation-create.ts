import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  HACKATHON_LIMIT,
  type THackathonInvitation,
  type THackathonInvitationCreateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  EBadRequest,
  EConflict,
  type EDatabase,
  type EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';
import type { TSessionUser } from '#/shared/session.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  InvitationRepo,
  type TInvitationRepoId,
} from '#/hackathon/domain/invitation-repo.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import {
  deadlineEnsure,
  leaderTeamFind,
} from '#/hackathon/application/hackathon-guards.ts';
import { toInvitationDto } from '#/hackathon/application/to-activity-dto.ts';

export const invitationCreate = Effect.fn('invitationCreate')(function* (
  input: THackathonInvitationCreateInput,
  actor: TSessionUser
): Effect.fn.Return<
  THackathonInvitation,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TMembershipRepoId | TInvitationRepoId | TStorageServiceId
> {
  const invitationRepo = yield* InvitationRepo;
  const membershipRepo = yield* MembershipRepo;
  const { publicUrlOf } = yield* StorageService;
  const email = input.email.toLowerCase();

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );
  yield* leaderTeamFind(input.teamId, actor.id);

  if (email === actor.email.toLowerCase()) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.INVITATION_SELF,
    });
  }

  const state = yield* membershipRepo.teamState(input.teamId);

  if (state.hasSubmission) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.TEAM_LOCKED });
  }

  if (state.memberCount >= HACKATHON_LIMIT.TEAM_MAX_MEMBERS) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.TEAM_FULL });
  }

  const invitee = yield* membershipRepo.findByEmail(email);

  if (invitee !== null && invitee.teamId === input.teamId) {
    return yield* new EConflict({
      message: HACKATHON_MESSAGE.USER_ALREADY_IN_TEAM,
    });
  }

  const row = yield* invitationRepo.create({
    teamId: input.teamId,
    inviterId: actor.id,
    inviteeEmail: email,
  });

  return toInvitationDto(row, publicUrlOf);
});
