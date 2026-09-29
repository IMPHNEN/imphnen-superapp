import { HACKATHON_MESSAGE } from '@app/messages';
import type {
  THackathonParticipantIdInput,
  THackathonParticipantPublic,
} from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import {
  ParticipantRepo,
  type TParticipantRepoId,
} from '#/hackathon/domain/participant-repo.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { toParticipantPublicDto } from '#/hackathon/application/to-award-dto.ts';
import { toTeamSummaryDto } from '#/hackathon/application/to-team-dto.ts';

export const participantGet = Effect.fn('participantGet')(function* ({
  userId,
}: THackathonParticipantIdInput): Effect.fn.Return<
  THackathonParticipantPublic,
  ENotFound | EDatabase,
  TParticipantRepoId | TMembershipRepoId | TTeamRepoId | TStorageServiceId
> {
  const participantRepo = yield* ParticipantRepo;
  const membershipRepo = yield* MembershipRepo;
  const teamRepo = yield* TeamRepo;
  const { publicUrlOf } = yield* StorageService;

  const row = yield* participantRepo.find(userId);

  if (row === null || !row.registered) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.PARTICIPANT_NOT_FOUND,
    });
  }

  const membership = yield* membershipRepo.findByUser(userId);
  const team =
    membership === null ? null : yield* teamRepo.findDetail(membership.teamId);

  return toParticipantPublicDto(
    row,
    team === null ? null : toTeamSummaryDto(team, publicUrlOf)
  );
});
