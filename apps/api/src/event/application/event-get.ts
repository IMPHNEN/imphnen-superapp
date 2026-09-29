import { EVENT_MESSAGE } from '@app/messages';
import type { TEvent, TEventIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { toEventDto } from '#/event/application/to-event-dto.ts';
import { EventRepo, type TEventRepoId } from '#/event/domain/event.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const eventGet = Effect.fn('eventGet')(function* ({
  id,
}: TEventIdInput): Effect.fn.Return<
  TEvent,
  ENotFound | EDatabase,
  TEventRepoId
> {
  const eventRepo = yield* EventRepo;
  const row = yield* eventRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: EVENT_MESSAGE.NOT_FOUND });
  }

  return toEventDto(row);
});
