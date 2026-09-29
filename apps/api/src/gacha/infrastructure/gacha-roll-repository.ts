import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { and, asc, eq, exists, gt, gte, isNull, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import {
  GachaRollRepo,
  type TGachaRollRepo,
} from '#/gacha/domain/gacha-roll.ts';
import { GACHA_RULE } from '#/gacha/domain/gacha-rules.ts';
import { rollOutcomeOf } from '#/gacha/infrastructure/gacha-roll-outcome.ts';
import { gachaClaimItemFields } from '#/gacha/infrastructure/gacha-claim-select.ts';
import { DbService } from '#/platform/db/db-service.ts';
import {
  gachaClaim,
  gachaCredit,
  gachaItem,
} from '#/platform/db/tables/gacha.ts';
import { EDatabase } from '#/shared/errors.ts';

export const gachaRollRepoLayer = Layer.effect(
  GachaRollRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const candidates: TGachaRollRepo['candidates'] = () =>
      Effect.tryPromise({
        try: () =>
          db
            .select({ id: gachaItem.id, weight: gachaItem.weight })
            .from(gachaItem)
            .where(
              and(
                isNull(gachaItem.deletedAt),
                gt(gachaItem.stock, 0),
                gt(gachaItem.weight, 0)
              )
            )
            .orderBy(asc(gachaItem.id)),
        catch: (cause) => new EDatabase({ cause }),
      });

    const commit: TGachaRollRepo['commit'] = (userId, itemId, cost) =>
      Effect.tryPromise({
        try: async () => {
          const claimId = crypto.randomUUID();
          const now = new Date();
          const creditSufficient = db
            .select({ userId: gachaCredit.userId })
            .from(gachaCredit)
            .where(
              and(
                eq(gachaCredit.userId, userId),
                gte(gachaCredit.balance, cost)
              )
            );
          const claimRecorded = db
            .select({ id: gachaClaim.id })
            .from(gachaClaim)
            .where(eq(gachaClaim.id, claimId));

          const [recorded, , , credit, item] = await db.batch([
            db
              .insert(gachaClaim)
              .select(
                db
                  .select({
                    id: sql`${claimId}`.as(gachaClaim.id.name),
                    userId: sql`${userId}`.as(gachaClaim.userId.name),
                    itemId: gachaItem.id,
                    source: sql`${GACHA_CLAIM_SOURCE.ROLL}`.as(
                      gachaClaim.source.name
                    ),
                    status: sql`${GACHA_CLAIM_STATUS.PENDING}`.as(
                      gachaClaim.status.name
                    ),
                    quantity: sql`${GACHA_RULE.CLAIM_QUANTITY}`.as(
                      gachaClaim.quantity.name
                    ),
                    fulfilledAt: sql`null`.as(gachaClaim.fulfilledAt.name),
                    fulfilledBy: sql`null`.as(gachaClaim.fulfilledBy.name),
                    createdAt: sql`${now.getTime()}`.as(
                      gachaClaim.createdAt.name
                    ),
                    updatedAt: sql`${now.getTime()}`.as(
                      gachaClaim.updatedAt.name
                    ),
                  })
                  .from(gachaItem)
                  .where(
                    and(
                      eq(gachaItem.id, itemId),
                      gt(gachaItem.stock, 0),
                      isNull(gachaItem.deletedAt),
                      exists(creditSufficient)
                    )
                  )
              )
              .returning({ id: gachaClaim.id }),
            db
              .update(gachaItem)
              .set({
                stock: sql`${gachaItem.stock} - ${GACHA_RULE.CLAIM_QUANTITY}`,
                updatedAt: now,
              })
              .where(and(eq(gachaItem.id, itemId), exists(claimRecorded))),
            db
              .update(gachaCredit)
              .set({
                balance: sql`${gachaCredit.balance} - ${cost}`,
                updatedAt: now,
              })
              .where(
                and(eq(gachaCredit.userId, userId), exists(claimRecorded))
              ),
            db
              .select({ balance: gachaCredit.balance })
              .from(gachaCredit)
              .where(eq(gachaCredit.userId, userId)),
            db
              .select(gachaClaimItemFields)
              .from(gachaItem)
              .where(eq(gachaItem.id, itemId)),
          ]);

          return rollOutcomeOf({
            claimId,
            userId,
            now,
            cost,
            recorded: recorded.length > 0,
            balance: credit[0]?.balance ?? 0,
            item: item[0],
          });
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return GachaRollRepo.of({ candidates, commit });
  })
);
