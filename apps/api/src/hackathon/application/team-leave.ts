import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonIdInput } from '@app/schemas';
import { Effect } from 'effect';
import type {
  EBadRequest,
  EConflict,
  EDatabase,
  ENotFound,
} from '#/shared/errors.ts';
import type { TMembershipRepoId } from '#/hackathon/domain/membership-repo.ts';
import { memberRemoval } from '#/hackathon/application/member-removal.ts';

export const teamLeave = Effect.fn('teamLeave')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonIdInput,
  EBadRequest | EConflict | ENotFound | EDatabase,
  TMembershipRepoId
> {
  yield* memberRemoval(id, actorId, HACKATHON_MESSAGE.LEADER_CANNOT_LEAVE);
  return { id };
});
