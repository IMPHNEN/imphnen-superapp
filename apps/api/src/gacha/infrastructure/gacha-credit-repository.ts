import { eq, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import {
  GachaCreditRepo,
  type TGachaCreditRepo,
  type TGachaCreditRow,
} from '#/gacha/domain/gacha-credit.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { gachaCredit } from '#/platform/db/tables/gacha.ts';
import { EDatabase } from '#/shared/errors.ts';

export const gachaCreditRepoLayer = Layer.effect(
  GachaCreditRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const findByUser: TGachaCreditRepo['findByUser'] = (userId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(gachaCredit)
            .where(eq(gachaCredit.userId, userId))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const recipientFind: TGachaCreditRepo['recipientFind'] = (userId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const grant: TGachaCreditRepo['grant'] = (userId, amount) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .insert(gachaCredit)
            .values({ userId, balance: amount })
            .onConflictDoUpdate({
              target: gachaCredit.userId,
              set: {
                balance: sql`${gachaCredit.balance} + ${amount}`,
                updatedAt: new Date(),
              },
            })
            .returning();
          return row as TGachaCreditRow;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return GachaCreditRepo.of({ findByUser, recipientFind, grant });
  })
);
