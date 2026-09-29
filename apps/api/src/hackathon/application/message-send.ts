import type {
  THackathonMessage,
  THackathonMessageSendInput,
} from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase, EForbidden } from '#/shared/errors.ts';
import type { TMembershipRepoId } from '#/hackathon/domain/membership-repo.ts';
import {
  MessageRepo,
  type TMessageRepoId,
} from '#/hackathon/domain/message-repo.ts';
import { membershipEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { toMessageDto } from '#/hackathon/application/to-activity-dto.ts';

export const messageSend = Effect.fn('messageSend')(function* (
  input: THackathonMessageSendInput,
  actorId: string
): Effect.fn.Return<
  THackathonMessage,
  EForbidden | EDatabase,
  TMembershipRepoId | TMessageRepoId
> {
  const messageRepo = yield* MessageRepo;

  yield* membershipEnsure(input.teamId, actorId);
  const row = yield* messageRepo.create({
    teamId: input.teamId,
    userId: actorId,
    body: input.body,
  });

  return toMessageDto(row);
});
