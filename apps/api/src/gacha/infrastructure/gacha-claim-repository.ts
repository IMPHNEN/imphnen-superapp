import { GACHA_CLAIM_STATUS, type TGachaClaimStatus } from '@app/schemas';
import { and, count, desc, eq, or, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import {
  GachaClaimRepo,
  type TGachaClaimRepo,
} from '#/gacha/domain/gacha-claim.ts';
import {
  gachaClaimAdminFields,
  gachaClaimFields,
} from '#/gacha/infrastructure/gacha-claim-select.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { gachaClaim, gachaItem } from '#/platform/db/tables/gacha.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';

const statusWhere = (status: TGachaClaimStatus | undefined): SQL | undefined =>
  match(status)
    .with(P.nonNullable, (value) => eq(gachaClaim.status, value))
    .otherwise(() => undefined);

const userWhere = (userId: string | undefined): SQL | undefined =>
  match(userId)
    .with(P.nonNullable, (value) => eq(gachaClaim.userId, value))
    .otherwise(() => undefined);

const searchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.nonNullable, (value) =>
      or(
        containsWhere(user.name, value),
        containsWhere(user.email, value),
        containsWhere(gachaItem.name, value),
        containsWhere(gachaItem.code, value)
      )
    )
    .otherwise(() => undefined);

const newestFirst = [desc(gachaClaim.createdAt), desc(gachaClaim.id)];

export const gachaClaimRepoLayer = Layer.effect(
  GachaClaimRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const listMine: TGachaClaimRepo['listMine'] = (userId, input) => {
      const where = and(
        eq(gachaClaim.userId, userId),
        statusWhere(input.status)
      );

      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select(gachaClaimFields)
              .from(gachaClaim)
              .innerJoin(gachaItem, eq(gachaItem.id, gachaClaim.itemId))
              .where(where)
              .orderBy(...newestFirst)
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db.select({ value: count() }).from(gachaClaim).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const list: TGachaClaimRepo['list'] = (input) => {
      const where = and(
        statusWhere(input.status),
        userWhere(input.userId),
        searchWhere(input.search)
      );

      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select(gachaClaimAdminFields)
              .from(gachaClaim)
              .innerJoin(gachaItem, eq(gachaItem.id, gachaClaim.itemId))
              .innerJoin(user, eq(user.id, gachaClaim.userId))
              .where(where)
              .orderBy(...newestFirst)
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db
              .select({ value: count() })
              .from(gachaClaim)
              .innerJoin(gachaItem, eq(gachaItem.id, gachaClaim.itemId))
              .innerJoin(user, eq(user.id, gachaClaim.userId))
              .where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TGachaClaimRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(gachaClaimAdminFields)
            .from(gachaClaim)
            .innerJoin(gachaItem, eq(gachaItem.id, gachaClaim.itemId))
            .innerJoin(user, eq(user.id, gachaClaim.userId))
            .where(eq(gachaClaim.id, id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const fulfil: TGachaClaimRepo['fulfil'] = (id, actorId) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const result = await db
            .update(gachaClaim)
            .set({
              status: GACHA_CLAIM_STATUS.FULFILLED,
              fulfilledAt: now,
              fulfilledBy: actorId,
              updatedAt: now,
            })
            .where(
              and(
                eq(gachaClaim.id, id),
                eq(gachaClaim.status, GACHA_CLAIM_STATUS.PENDING)
              )
            )
            .returning({ id: gachaClaim.id });
          return result.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return GachaClaimRepo.of({ listMine, list, findById, fulfil });
  })
);
