import { A } from '@mobily/ts-belt';
import type { TActivityEntry, TActivityRepo } from '@app/activity';
import { and, count, eq, inArray, lt, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EDatabase } from '#/shared/errors.ts';
import {
  ActivityPruner,
  ActivityRepo,
  type TActivityPruner,
  type TActivityReader,
} from '#/activity/domain/activity.ts';
import {
  ActivityRecorder,
  type TActivityRecorder,
} from '#/shared/activity-recorder.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';
import { ACTIVITY_SORT, type TActivitySort } from '@app/schemas';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { activityMetadataDecode } from '#/activity/infrastructure/activity-metadata.ts';
import { activityLog } from '#/platform/db/tables/activity.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const activityRepositoryCreate = (db: TDb): TActivityRepo => ({
  insert: async (entry: TActivityEntry): Promise<void> => {
    await db.insert(activityLog).values({
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata ?? null,
    });
  },
});

const SORT_COLUMN: Record<TActivitySort, AnySQLiteColumn> = {
  [ACTIVITY_SORT.CREATED_AT]: activityLog.createdAt,
  [ACTIVITY_SORT.ACTION]: activityLog.action,
  [ACTIVITY_SORT.RESOURCE_TYPE]: activityLog.resourceType,
};

const optionalEq = (
  column: AnySQLiteColumn,
  value: string | undefined
): SQL | undefined =>
  match(value)
    .with(P.nonNullable, (found) => eq(column, found))
    .otherwise(() => undefined);

export const activityRecorderLayer = Layer.effect(
  ActivityRecorder,
  Effect.gen(function* () {
    const { db } = yield* DbService;
    const repo = activityRepositoryCreate(db);

    const insert: TActivityRecorder['insert'] = (entry: TActivityEntry) =>
      Effect.tryPromise({
        try: () => repo.insert(entry),
        catch: (cause) => new EDatabase({ cause }),
      });

    return ActivityRecorder.of({ insert });
  })
);

export const activityRepoLayer = Layer.effect(
  ActivityRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;
    const list: TActivityReader['list'] = ({
      page,
      pageSize,
      action,
      resourceType,
      actorId,
      sortBy,
      sortDir,
    }) => {
      const where = and(
        optionalEq(activityLog.action, action),
        optionalEq(activityLog.resourceType, resourceType),
        optionalEq(activityLog.actorId, actorId)
      );

      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select({
                id: activityLog.id,
                actorId: activityLog.actorId,
                actorEmail: user.email,
                action: activityLog.action,
                resourceType: activityLog.resourceType,
                resourceId: activityLog.resourceId,
                metadata: activityLog.metadata,
                createdAt: activityLog.createdAt,
              })
              .from(activityLog)
              .leftJoin(user, eq(user.id, activityLog.actorId))
              .where(where)
              .orderBy(orderFor(SORT_COLUMN[sortBy], sortDir))
              .limit(pageSize)
              .offset(offsetFor({ page, pageSize })),
            db.select({ value: count() }).from(activityLog).where(where),
          ]);
          return {
            items: A.map(items, (row) => ({
              ...row,
              metadata: activityMetadataDecode(row.metadata),
            })),
            total,
          };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    return ActivityRepo.of({ list });
  })
);

export const activityPrunerLayer = Layer.effect(
  ActivityPruner,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const deleteOlderThan: TActivityPruner['deleteOlderThan'] = (
      cutoff,
      batchSize
    ) =>
      Effect.tryPromise({
        try: async (): Promise<number> => {
          const stale = db
            .select({ id: activityLog.id })
            .from(activityLog)
            .where(lt(activityLog.createdAt, cutoff))
            .limit(batchSize);

          const removed = await db
            .delete(activityLog)
            .where(inArray(activityLog.id, stale))
            .returning({ id: activityLog.id });

          return removed.length;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return ActivityPruner.of({ deleteOlderThan });
  })
);
