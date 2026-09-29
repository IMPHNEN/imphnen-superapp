import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { EVENT_MESSAGE } from '@app/messages';
import type { TEventIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { EventRepo, type TEventRepoId } from '#/event/domain/event.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const eventDelete = Effect.fn('eventDelete')(function* (
  { id }: TEventIdInput,
  actorId: string
): Effect.fn.Return<
  TEventIdInput,
  ENotFound | EDatabase,
  TEventRepoId | TActivityRecorderId
> {
  const eventRepo = yield* EventRepo;
  const activityRepo = yield* ActivityRecorder;

  const row = yield* eventRepo.softDelete(id);

  if (row === null) {
    return yield* new ENotFound({ message: EVENT_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.EVENT_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.EVENT,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.TITLE]: row.name }),
  });

  return { id };
});
