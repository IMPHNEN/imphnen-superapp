import { HACKATHON_MESSAGE } from '@app/messages';
import type {
  THackathonMessageList,
  THackathonMessageListInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import {
  EBadRequest,
  type EDatabase,
  type EForbidden,
} from '#/shared/errors.ts';
import type { TMembershipRepoId } from '#/hackathon/domain/membership-repo.ts';
import {
  MESSAGE_DIRECTION,
  MessageRepo,
  type TMessageRepoId,
} from '#/hackathon/domain/message-repo.ts';
import { membershipEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { toMessageDto } from '#/hackathon/application/to-activity-dto.ts';

export const messageList = Effect.fn('messageList')(function* (
  input: THackathonMessageListInput,
  actorId: string
): Effect.fn.Return<
  THackathonMessageList,
  EBadRequest | EForbidden | EDatabase,
  TMembershipRepoId | TMessageRepoId
> {
  const messageRepo = yield* MessageRepo;

  yield* membershipEnsure(input.teamId, actorId);

  if (input.before !== undefined && input.after !== undefined) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.CHAT_CURSOR_INVALID,
    });
  }

  const cursorId = input.after ?? input.before;
  const cursor =
    cursorId === undefined ? null : yield* messageRepo.find(cursorId);

  if (cursorId !== undefined && cursor?.teamId !== input.teamId) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.CHAT_CURSOR_INVALID,
    });
  }

  const page = yield* messageRepo.list({
    teamId: input.teamId,
    direction:
      input.after === undefined
        ? MESSAGE_DIRECTION.OLDER
        : MESSAGE_DIRECTION.NEWER,
    cursor:
      cursor === null ? null : { createdAt: cursor.createdAt, id: cursor.id },
    limit: input.limit,
  });

  return { items: A.map(page.items, toMessageDto), hasMore: page.hasMore };
});
