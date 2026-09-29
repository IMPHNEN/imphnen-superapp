import { and, count, eq } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { DbService } from '#/platform/db/db-service.ts';
import { roadmapItem, roadmapVote } from '#/platform/db/tables/roadmap.ts';
import {
  RoadmapItemRepo,
  type TRoadmapItemRepo,
} from '#/roadmap/domain/roadmap-item.ts';
import {
  roadmapColumns,
  roadmapListWhere,
  roadmapLiveByIdWhere,
  roadmapOrder,
} from '#/roadmap/infrastructure/roadmap-query.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';

export const roadmapItemRepoLayer = Layer.effect(
  RoadmapItemRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TRoadmapItemRepo['list'] = (input, viewerId) => {
      const where = roadmapListWhere(input);
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select(roadmapColumns(viewerId))
              .from(roadmapItem)
              .where(where)
              .limit(input.pageSize)
              .offset(offsetFor(input))
              .orderBy(roadmapOrder(input)),
            db.select({ value: count() }).from(roadmapItem).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TRoadmapItemRepo['findById'] = (id, viewerId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(roadmapColumns(viewerId))
            .from(roadmapItem)
            .where(roadmapLiveByIdWhere(id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TRoadmapItemRepo['create'] = (input) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .insert(roadmapItem)
            .values(input)
            .returning({ id: roadmapItem.id });
          return row.id;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const update: TRoadmapItemRepo['update'] = (id, input) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .update(roadmapItem)
            .set({ ...input, updatedAt: new Date() })
            .where(roadmapLiveByIdWhere(id))
            .returning({ id: roadmapItem.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const softDelete: TRoadmapItemRepo['softDelete'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const rows = await db
            .update(roadmapItem)
            .set({ deletedAt: now, updatedAt: now })
            .where(roadmapLiveByIdWhere(id))
            .returning({ id: roadmapItem.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const voteCast: TRoadmapItemRepo['voteCast'] = (itemId, userId) =>
      Effect.tryPromise({
        try: async (): Promise<void> => {
          await db
            .insert(roadmapVote)
            .values({ itemId, userId })
            .onConflictDoNothing();
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const voteWithdraw: TRoadmapItemRepo['voteWithdraw'] = (itemId, userId) =>
      Effect.tryPromise({
        try: async (): Promise<void> => {
          await db
            .delete(roadmapVote)
            .where(
              and(
                eq(roadmapVote.itemId, itemId),
                eq(roadmapVote.userId, userId)
              )
            );
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return RoadmapItemRepo.of({
      list,
      findById,
      create,
      update,
      softDelete,
      voteCast,
      voteWithdraw,
    });
  })
);
