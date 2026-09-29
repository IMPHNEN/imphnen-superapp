import { EVENT_SORT, type TEventSort } from '@app/schemas';
import { and, count, eq, isNull, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EventRepo, type TEventRepo } from '#/event/domain/event.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { event } from '#/platform/db/tables/event.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';

const SORT_COLUMN: Record<TEventSort, AnySQLiteColumn> = {
  [EVENT_SORT.NAME]: event.name,
  [EVENT_SORT.START_DATE]: event.startDate,
  [EVENT_SORT.CREATED_AT]: event.createdAt,
};

const liveWhere = isNull(event.deletedAt);

const searchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.nonNullable, (value) => containsWhere(event.name, value))
    .otherwise(() => undefined);

const liveByIdWhere = (id: string): SQL | undefined =>
  and(eq(event.id, id), liveWhere);

export const eventRepoLayer = Layer.effect(
  EventRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TEventRepo['list'] = ({
      page,
      pageSize,
      search,
      sortBy,
      sortDir,
    }) => {
      const where = and(liveWhere, searchWhere(search));
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select()
              .from(event)
              .where(where)
              .limit(pageSize)
              .offset(offsetFor({ page, pageSize }))
              .orderBy(orderFor(SORT_COLUMN[sortBy], sortDir)),
            db.select({ value: count() }).from(event).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TEventRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(event)
            .where(liveByIdWhere(id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TEventRepo['create'] = (values) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db.insert(event).values(values).returning();
          return row;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const update: TEventRepo['update'] = (id, values) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(event)
            .set({ ...values, updatedAt: new Date() })
            .where(liveByIdWhere(id))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const softDelete: TEventRepo['softDelete'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const [row] = await db
            .update(event)
            .set({ deletedAt: now, updatedAt: now })
            .where(liveByIdWhere(id))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return EventRepo.of({ list, findById, create, update, softDelete });
  })
);
