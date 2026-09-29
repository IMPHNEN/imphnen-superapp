import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  type THackathonTeam,
  type THackathonTeamUpdateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import type {
  EBadRequest,
  EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import {
  deadlineEnsure,
  leaderTeamFind,
} from '#/hackathon/application/hackathon-guards.ts';
import { teamView } from '#/hackathon/application/team-view.ts';

export const teamUpdate = Effect.fn('teamUpdate')(function* (
  input: THackathonTeamUpdateInput,
  actorId: string
): Effect.fn.Return<
  THackathonTeam,
  EBadRequest | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TStorageServiceId
> {
  const teamRepo = yield* TeamRepo;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );
  yield* leaderTeamFind(input.id, actorId);
  yield* teamRepo.update(input);

  return yield* teamView(input.id, { userId: actorId, canManage: false });
});
