import type { TEventList, TEventListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toEventDto } from '#/event/application/to-event-dto.ts';
import { EventRepo, type TEventRepoId } from '#/event/domain/event.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const eventList = Effect.fn('eventList')(function* (
  input: TEventListInput
): Effect.fn.Return<TEventList, EDatabase, TEventRepoId> {
  const eventRepo = yield* EventRepo;
  const { items, total } = yield* eventRepo.list(input);
  return {
    items: A.map(items, toEventDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
