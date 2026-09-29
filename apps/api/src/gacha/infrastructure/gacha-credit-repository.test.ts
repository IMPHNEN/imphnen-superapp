import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GachaCreditRepo,
  type TGachaCreditRepoId,
} from '#/gacha/domain/gacha-credit.ts';
import { gachaCreditRepoLayer } from '#/gacha/infrastructure/gacha-credit-repository.ts';
import {
  balanceOf,
  creditSeed,
  FIXTURE_USER,
  usersSeed,
} from '#/gacha/infrastructure/testing/gacha-fixtures.ts';
import {
  sqliteDbCreate,
  sqliteDbLayer,
} from '#/gacha/infrastructure/testing/sqlite-d1.ts';
import type { TDb } from '#/platform/db/client.ts';
import { gachaCredit } from '#/platform/db/tables/gacha.ts';
import type { EDatabase } from '#/shared/errors.ts';

const UNKNOWN_USER_ID = '99999999-9999-4999-8999-999999999999';

let db: TDb;

const run = <A>(
  program: Effect.Effect<A, EDatabase, TGachaCreditRepoId>
): Promise<A> =>
  Effect.runPromise(
    program.pipe(
      Effect.provide(gachaCreditRepoLayer),
      Effect.provide(sqliteDbLayer(db))
    )
  );

beforeEach(async (): Promise<void> => {
  ({ db } = await sqliteDbCreate());
  await usersSeed(db);
});

describe('gachaCreditRepo', () => {
  it('opens a balance on the first grant and adds to it afterwards', async (): Promise<void> => {
    const [first, second] = await run(
      GachaCreditRepo.use((repo) =>
        Effect.all([
          repo.grant(FIXTURE_USER.id, 3),
          repo.grant(FIXTURE_USER.id, 4),
        ])
      )
    );

    expect([first.balance, second.balance]).toEqual([3, 7]);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(7);
  });

  it('finds the recipient and reports an unknown user as null', async (): Promise<void> => {
    const [known, unknown] = await run(
      GachaCreditRepo.use((repo) =>
        Effect.all([
          repo.recipientFind(FIXTURE_USER.id),
          repo.recipientFind(UNKNOWN_USER_ID),
        ])
      )
    );

    expect(known).toEqual(FIXTURE_USER);
    expect(unknown).toBeNull();
  });

  it('never stores a negative balance', async (): Promise<void> => {
    await creditSeed(db, FIXTURE_USER.id, 1);

    await expect(
      db
        .update(gachaCredit)
        .set({ balance: -1 })
        .where(eq(gachaCredit.userId, FIXTURE_USER.id))
    ).rejects.toThrow();
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(1);
  });
});
