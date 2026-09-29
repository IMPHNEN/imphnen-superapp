import { EVENT_MESSAGE } from '@app/messages';
import type { TEventCreateInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  EVENT_DAY_BOUNDARY,
  eventDateResolve,
} from '#/event/domain/event-date.ts';
import type { TEventWrite } from '#/event/domain/event.ts';
import { EBadRequest } from '#/shared/errors.ts';

export const eventWriteResolve = Effect.fn('eventWriteResolve')(function* (
  input: TEventCreateInput
): Effect.fn.Return<TEventWrite, EBadRequest> {
  const startDate = eventDateResolve(input.startDate, EVENT_DAY_BOUNDARY.START);
  const endDate = eventDateResolve(input.endDate, EVENT_DAY_BOUNDARY.END);

  if (endDate.getTime() < startDate.getTime()) {
    return yield* new EBadRequest({ message: EVENT_MESSAGE.END_BEFORE_START });
  }

  return {
    name: input.name,
    description: input.description,
    detailLink: input.detailLink,
    price: input.price,
    isOnline: input.isOnline,
    location: input.location,
    startDate,
    endDate,
  };
});
