import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { ROADMAP_MESSAGE } from '@app/messages';
import type {
  TRoadmapCreateInput,
  TRoadmapIdInput,
  TRoadmapItem,
  TRoadmapUpdateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { roadmapFind } from '#/roadmap/application/roadmap-read.ts';
import { toRoadmapDto } from '#/roadmap/application/to-roadmap-dto.ts';
import {
  RoadmapItemRepo,
  type TRoadmapItemRepoId,
} from '#/roadmap/domain/roadmap-item.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

type TRoadmapWriteServices = TRoadmapItemRepoId | TActivityRecorderId;

export const roadmapCreate = Effect.fn('roadmapCreate')(function* (
  input: TRoadmapCreateInput,
  actorId: string
): Effect.fn.Return<
  TRoadmapItem,
  ENotFound | EDatabase,
  TRoadmapWriteServices
> {
  const roadmapRepo = yield* RoadmapItemRepo;
  const activityRepo = yield* ActivityRecorder;

  const id = yield* roadmapRepo.create(input);

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.ROADMAP_ITEM_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.ROADMAP_ITEM,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.TITLE]: input.title }),
  });

  return toRoadmapDto(yield* roadmapFind(id, actorId));
});

export const roadmapUpdate = Effect.fn('roadmapUpdate')(function* (
  { id, ...input }: TRoadmapUpdateInput,
  actorId: string
): Effect.fn.Return<
  TRoadmapItem,
  ENotFound | EDatabase,
  TRoadmapWriteServices
> {
  const roadmapRepo = yield* RoadmapItemRepo;
  const activityRepo = yield* ActivityRecorder;

  const updated = yield* roadmapRepo.update(id, input);

  if (!updated) {
    return yield* new ENotFound({ message: ROADMAP_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.ROADMAP_ITEM_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.ROADMAP_ITEM,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.TITLE]: input.title }),
  });

  return toRoadmapDto(yield* roadmapFind(id, actorId));
});

export const roadmapDelete = Effect.fn('roadmapDelete')(function* (
  { id }: TRoadmapIdInput,
  actorId: string
): Effect.fn.Return<
  TRoadmapIdInput,
  ENotFound | EDatabase,
  TRoadmapWriteServices
> {
  const roadmapRepo = yield* RoadmapItemRepo;
  const activityRepo = yield* ActivityRecorder;

  const removed = yield* roadmapRepo.softDelete(id);

  if (!removed) {
    return yield* new ENotFound({ message: ROADMAP_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.ROADMAP_ITEM_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.ROADMAP_ITEM,
    resourceId: id,
  });

  return { id };
});
