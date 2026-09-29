import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { EVENT_MESSAGE } from '@app/messages';
import type { TEvent, TEventUpdateInput } from '@app/schemas';
import { Effect } from 'effect';
import { eventWriteResolve } from '#/event/application/event-write.ts';
import { toEventDto } from '#/event/application/to-event-dto.ts';
import { EventRepo, type TEventRepoId } from '#/event/domain/event.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  type EBadRequest,
  type EDatabase,
  ENotFound,
} from '#/shared/errors.ts';

export const eventUpdate = Effect.fn('eventUpdate')(function* (
  { id, ...input }: TEventUpdateInput,
  actorId: string
): Effect.fn.Return<
  TEvent,
  ENotFound | EBadRequest | EDatabase,
  TEventRepoId | TActivityRecorderId
> {
  const eventRepo = yield* EventRepo;
  const activityRepo = yield* ActivityRecorder;

  const values = yield* eventWriteResolve(input);
  const row = yield* eventRepo.update(id, values);

  if (row === null) {
    return yield* new ENotFound({ message: EVENT_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.EVENT_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.EVENT,
    resourceId: row.id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.TITLE]: row.name }),
  });

  return toEventDto(row);
});
