import type { THackathonTeam } from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { toTeamDto } from '#/hackathon/application/to-team-dto.ts';

export const teamMine = Effect.fn('teamMine')(function* (
  userId: string
): Effect.fn.Return<
  THackathonTeam | null,
  EDatabase,
  TMembershipRepoId | TTeamRepoId | TStorageServiceId
> {
  const membershipRepo = yield* MembershipRepo;
  const teamRepo = yield* TeamRepo;
  const { publicUrlOf } = yield* StorageService;

  const membership = yield* membershipRepo.findByUser(userId);
  const row =
    membership === null ? null : yield* teamRepo.findDetail(membership.teamId);

  return row === null
    ? null
    : toTeamDto(row, publicUrlOf, { userId, canManage: false });
});
