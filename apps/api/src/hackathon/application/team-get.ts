import type { THackathonIdInput, THackathonTeam } from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase, ENotFound } from '#/shared/errors.ts';
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import type { THackathonViewer } from '#/hackathon/domain/viewer.ts';
import { teamView } from '#/hackathon/application/team-view.ts';

export const teamGet = Effect.fn('teamGet')(function* (
  { id }: THackathonIdInput,
  viewer: THackathonViewer
): Effect.fn.Return<
  THackathonTeam,
  ENotFound | EDatabase,
  TTeamRepoId | TStorageServiceId
> {
  return yield* teamView(id, viewer);
});
