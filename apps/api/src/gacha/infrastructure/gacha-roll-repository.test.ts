import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GACHA_ROLL_OUTCOME,
  GachaRollRepo,
  type TGachaRollCandidate,
  type TGachaRollRepoId,
} from '#/gacha/domain/gacha-roll.ts';
import { gachaRollRepoLayer } from '#/gacha/infrastructure/gacha-roll-repository.ts';
import {
  balanceOf,
  claimCountOf,
  creditSeed,
  FIXTURE_USER,
  itemSeed,
  stockOf,
  usersSeed,
} from '#/gacha/infrastructure/testing/gacha-fixtures.ts';
import {
  sqliteDbCreate,
  sqliteDbLayer,
} from '#/gacha/infrastructure/testing/sqlite-d1.ts';
import type { TDb } from '#/platform/db/client.ts';
import { gachaItem } from '#/platform/db/tables/gacha.ts';
import type { EDatabase } from '#/shared/errors.ts';

const COST = 1;

let db: TDb;

const run = <A>(
  program: Effect.Effect<A, EDatabase, TGachaRollRepoId>
): Promise<A> =>
  Effect.runPromise(
    program.pipe(
      Effect.provide(gachaRollRepoLayer),
      Effect.provide(sqliteDbLayer(db))
    )
  );

beforeEach(async (): Promise<void> => {
  ({ db } = await sqliteDbCreate());
  await usersSeed(db);
});

describe('gachaRollRepo.commit', () => {
  it('spends the roll cost, takes one from stock and records a pending claim', async (): Promise<void> => {
    const itemId = await itemSeed(db, { stock: 2 });
    await creditSeed(db, FIXTURE_USER.id, 3);

    const outcome = await run(
      GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST))
    );

    expect(outcome).toMatchObject({
      kind: GACHA_ROLL_OUTCOME.WON,
      balance: 2,
      claim: {
        userId: FIXTURE_USER.id,
        source: GACHA_CLAIM_SOURCE.ROLL,
        status: GACHA_CLAIM_STATUS.PENDING,
        item: { id: itemId },
      },
    });
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(2);
    expect(await stockOf(db, itemId)).toBe(1);
    expect(await claimCountOf(db, FIXTURE_USER.id)).toBe(1);
  });

  it('changes nothing when the user has no credit row', async (): Promise<void> => {
    const itemId = await itemSeed(db);

    const outcome = await run(
      GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST))
    );

    expect(outcome.kind).toBe(GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS);
    expect(await stockOf(db, itemId)).toBe(5);
    expect(await claimCountOf(db, FIXTURE_USER.id)).toBe(0);
  });

  it('changes nothing when the balance is below the cost', async (): Promise<void> => {
    const itemId = await itemSeed(db);
    await creditSeed(db, FIXTURE_USER.id, 1);

    const outcome = await run(
      GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, 2))
    );

    expect(outcome.kind).toBe(GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(1);
    expect(await stockOf(db, itemId)).toBe(5);
    expect(await claimCountOf(db, FIXTURE_USER.id)).toBe(0);
  });

  it('does not charge the user when the item is out of stock', async (): Promise<void> => {
    const itemId = await itemSeed(db, { stock: 0 });
    await creditSeed(db, FIXTURE_USER.id, 3);

    const outcome = await run(
      GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST))
    );

    expect(outcome.kind).toBe(GACHA_ROLL_OUTCOME.OUT_OF_STOCK);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(3);
    expect(await claimCountOf(db, FIXTURE_USER.id)).toBe(0);
  });

  it('does not charge the user for an item deleted after the pick', async (): Promise<void> => {
    const itemId = await itemSeed(db);
    await creditSeed(db, FIXTURE_USER.id, 3);
    await db
      .update(gachaItem)
      .set({ deletedAt: new Date() })
      .where(eq(gachaItem.id, itemId));

    const outcome = await run(
      GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST))
    );

    expect(outcome.kind).toBe(GACHA_ROLL_OUTCOME.OUT_OF_STOCK);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(3);
  });

  it('sells the last unit once across two rolls', async (): Promise<void> => {
    const itemId = await itemSeed(db, { stock: 1 });
    await creditSeed(db, FIXTURE_USER.id, 5);

    const outcomes = await run(
      Effect.all([
        GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST)),
        GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST)),
      ])
    );

    expect(A.map(outcomes, (outcome) => outcome.kind)).toEqual([
      GACHA_ROLL_OUTCOME.WON,
      GACHA_ROLL_OUTCOME.OUT_OF_STOCK,
    ]);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(4);
    expect(await stockOf(db, itemId)).toBe(0);
  });

  it('spends the last credit once across two rolls', async (): Promise<void> => {
    const itemId = await itemSeed(db, { stock: 5 });
    await creditSeed(db, FIXTURE_USER.id, 1);

    const outcomes = await run(
      Effect.all([
        GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST)),
        GachaRollRepo.use((repo) => repo.commit(FIXTURE_USER.id, itemId, COST)),
      ])
    );

    expect(A.map(outcomes, (outcome) => outcome.kind)).toEqual([
      GACHA_ROLL_OUTCOME.WON,
      GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS,
    ]);
    expect(await balanceOf(db, FIXTURE_USER.id)).toBe(0);
    expect(await stockOf(db, itemId)).toBe(4);
    expect(await claimCountOf(db, FIXTURE_USER.id)).toBe(1);
  });
});

describe('gachaRollRepo.candidates', () => {
  it('offers only live items with stock and a positive weight', async (): Promise<void> => {
    const live = await itemSeed(db, { code: 'live' });
    await itemSeed(db, { code: 'empty', stock: 0 });
    await itemSeed(db, { code: 'zero', weight: 0 });
    const gone = await itemSeed(db, { code: 'gone' });
    await db
      .update(gachaItem)
      .set({ deletedAt: new Date() })
      .where(eq(gachaItem.id, gone));

    const candidates = await run(
      GachaRollRepo.use((repo) => repo.candidates())
    );

    expect(candidates).toEqual<TGachaRollCandidate[]>([
      { id: live, weight: 1 },
    ]);
  });
});
