import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonMemberRemoveInput, THackathonTeam } from '@app/schemas';
import { Effect } from 'effect';
import type {
  EBadRequest,
  EConflict,
  EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import type { TMembershipRepoId } from '#/hackathon/domain/membership-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { leaderTeamFind } from '#/hackathon/application/hackathon-guards.ts';
import { memberRemoval } from '#/hackathon/application/member-removal.ts';
import { teamView } from '#/hackathon/application/team-view.ts';

export const teamMemberRemove = Effect.fn('teamMemberRemove')(function* (
  input: THackathonMemberRemoveInput,
  actorId: string
): Effect.fn.Return<
  THackathonTeam,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TMembershipRepoId | TStorageServiceId
> {
  yield* leaderTeamFind(input.teamId, actorId);
  yield* memberRemoval(
    input.teamId,
    input.userId,
    HACKATHON_MESSAGE.LEADER_CANNOT_BE_REMOVED
  );

  return yield* teamView(input.teamId, { userId: actorId, canManage: false });
});
