import { ROADMAP_MESSAGE } from '@app/messages';
import type {
  TRoadmapIdInput,
  TRoadmapItem,
  TRoadmapList,
  TRoadmapListInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toRoadmapDto } from '#/roadmap/application/to-roadmap-dto.ts';
import {
  RoadmapItemRepo,
  type TRoadmapItemRepoId,
  type TRoadmapItemRow,
} from '#/roadmap/domain/roadmap-item.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const roadmapList = Effect.fn('roadmapList')(function* (
  input: TRoadmapListInput,
  viewerId: string | null
): Effect.fn.Return<TRoadmapList, EDatabase, TRoadmapItemRepoId> {
  const roadmapRepo = yield* RoadmapItemRepo;
  const { items, total } = yield* roadmapRepo.list(input, viewerId);
  return {
    items: A.map(items, toRoadmapDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});

export const roadmapFind = Effect.fn('roadmapFind')(function* (
  id: string,
  viewerId: string | null
): Effect.fn.Return<
  TRoadmapItemRow,
  ENotFound | EDatabase,
  TRoadmapItemRepoId
> {
  const roadmapRepo = yield* RoadmapItemRepo;
  const row = yield* roadmapRepo.findById(id, viewerId);

  if (row === null) {
    return yield* new ENotFound({ message: ROADMAP_MESSAGE.NOT_FOUND });
  }

  return row;
});

export const roadmapGet = (
  { id }: TRoadmapIdInput,
  viewerId: string | null
): Effect.Effect<TRoadmapItem, ENotFound | EDatabase, TRoadmapItemRepoId> =>
  roadmapFind(id, viewerId).pipe(Effect.map(toRoadmapDto));
