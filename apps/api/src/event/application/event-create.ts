import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import type { TEvent, TEventCreateInput } from '@app/schemas';
import { Effect } from 'effect';
import { eventWriteResolve } from '#/event/application/event-write.ts';
import { toEventDto } from '#/event/application/to-event-dto.ts';
import { EventRepo, type TEventRepoId } from '#/event/domain/event.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { EBadRequest, EDatabase } from '#/shared/errors.ts';

export const eventCreate = Effect.fn('eventCreate')(function* (
  input: TEventCreateInput,
  actorId: string
): Effect.fn.Return<
  TEvent,
  EBadRequest | EDatabase,
  TEventRepoId | TActivityRecorderId
> {
  const eventRepo = yield* EventRepo;
  const activityRepo = yield* ActivityRecorder;

  const values = yield* eventWriteResolve(input);
  const row = yield* eventRepo.create(values);

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.EVENT_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.EVENT,
    resourceId: row.id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.TITLE]: row.name }),
  });

  return toEventDto(row);
});
