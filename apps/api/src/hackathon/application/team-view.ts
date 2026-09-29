import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonTeam } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import type { THackathonViewer } from '#/hackathon/domain/viewer.ts';
import { toTeamDto } from '#/hackathon/application/to-team-dto.ts';

export const teamView = Effect.fn('teamView')(function* (
  teamId: string,
  viewer: THackathonViewer
): Effect.fn.Return<
  THackathonTeam,
  ENotFound | EDatabase,
  TTeamRepoId | TStorageServiceId
> {
  const teamRepo = yield* TeamRepo;
  const { publicUrlOf } = yield* StorageService;
  const row = yield* teamRepo.findDetail(teamId);

  if (row === null) {
    return yield* new ENotFound({ message: HACKATHON_MESSAGE.TEAM_NOT_FOUND });
  }

  return toTeamDto(row, publicUrlOf, viewer);
});
