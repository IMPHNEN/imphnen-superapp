import { GACHA_MESSAGE } from '@app/messages';
import { GACHA_ITEM_SORT, type TGachaItemSort } from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { and, count, eq, isNull, or, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import {
  GachaItemRepo,
  type TGachaItemRepo,
  type TGachaItemRow,
} from '#/gacha/domain/gacha-item.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { gachaItem } from '#/platform/db/tables/gacha.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';

const SORT_COLUMN: Record<TGachaItemSort, AnySQLiteColumn> = {
  [GACHA_ITEM_SORT.NAME]: gachaItem.name,
  [GACHA_ITEM_SORT.CODE]: gachaItem.code,
  [GACHA_ITEM_SORT.STOCK]: gachaItem.stock,
  [GACHA_ITEM_SORT.WEIGHT]: gachaItem.weight,
  [GACHA_ITEM_SORT.CREATED_AT]: gachaItem.createdAt,
};

const liveWhere = isNull(gachaItem.deletedAt);

const searchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.nonNullable, (value) =>
      or(
        containsWhere(gachaItem.name, value),
        containsWhere(gachaItem.code, value)
      )
    )
    .otherwise(() => undefined);

const writeError = (cause: unknown): EConflict | EDatabase =>
  isUniqueViolation(cause)
    ? new EConflict({ message: GACHA_MESSAGE.ITEM_CODE_TAKEN })
    : new EDatabase({ cause });

export const gachaItemRepoLayer = Layer.effect(
  GachaItemRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TGachaItemRepo['list'] = (input) => {
      const where = and(liveWhere, searchWhere(input.search));

      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select()
              .from(gachaItem)
              .where(where)
              .orderBy(
                orderFor(SORT_COLUMN[input.sortBy], input.sortDir),
                gachaItem.id
              )
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db.select({ value: count() }).from(gachaItem).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TGachaItemRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(gachaItem)
            .where(and(eq(gachaItem.id, id), liveWhere))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TGachaItemRepo['create'] = (input) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db.insert(gachaItem).values(input).returning();
          return row as TGachaItemRow;
        },
        catch: writeError,
      });

    const update: TGachaItemRepo['update'] = ({ id, ...patch }) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(gachaItem)
            .set(D.merge(patch, { updatedAt: new Date() }))
            .where(and(eq(gachaItem.id, id), liveWhere))
            .returning();
          return row ?? null;
        },
        catch: writeError,
      });

    const softDelete: TGachaItemRepo['softDelete'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const [row] = await db
            .update(gachaItem)
            .set({ deletedAt: now, updatedAt: now })
            .where(and(eq(gachaItem.id, id), liveWhere))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return GachaItemRepo.of({ list, findById, create, update, softDelete });
  })
);
