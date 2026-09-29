import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, EForbidden, ENotFound } from '#/shared/errors.ts';
import {
  MessageRepo,
  type TMessageRepoId,
} from '#/hackathon/domain/message-repo.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';

export const messageDelete = Effect.fn('messageDelete')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonIdInput,
  EForbidden | ENotFound | EDatabase,
  TMessageRepoId | TTeamRepoId
> {
  const messageRepo = yield* MessageRepo;
  const teamRepo = yield* TeamRepo;
  const message = yield* messageRepo.find(id);

  if (message === null) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.CHAT_MESSAGE_NOT_FOUND,
    });
  }

  const team =
    message.author.id === actorId ? null : yield* teamRepo.find(message.teamId);

  if (message.author.id !== actorId && team?.leaderId !== actorId) {
    return yield* new EForbidden({
      message: HACKATHON_MESSAGE.CHAT_MESSAGE_DELETE_FORBIDDEN,
    });
  }

  yield* messageRepo.remove(id);
  return { id };
});
