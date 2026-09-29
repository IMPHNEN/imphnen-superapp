import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GachaClaimRepo,
  type TGachaClaimRepoId,
} from '#/gacha/domain/gacha-claim.ts';
import { gachaClaimRepoLayer } from '#/gacha/infrastructure/gacha-claim-repository.ts';
import {
  FIXTURE_OTHER_USER,
  FIXTURE_USER,
  itemSeed,
  usersSeed,
} from '#/gacha/infrastructure/testing/gacha-fixtures.ts';
import {
  sqliteDbCreate,
  sqliteDbLayer,
} from '#/gacha/infrastructure/testing/sqlite-d1.ts';
import type { TDb } from '#/platform/db/client.ts';
import { gachaClaim } from '#/platform/db/tables/gacha.ts';
import type { EDatabase } from '#/shared/errors.ts';

const PAGE = { page: 1, pageSize: 20 };

let db: TDb;
let mineId: string;
let otherId: string;

const run = <A>(
  program: Effect.Effect<A, EDatabase, TGachaClaimRepoId>
): Promise<A> =>
  Effect.runPromise(
    program.pipe(
      Effect.provide(gachaClaimRepoLayer),
      Effect.provide(sqliteDbLayer(db))
    )
  );

const claimSeed = async (userId: string, itemId: string): Promise<string> => {
  const [row] = await db
    .insert(gachaClaim)
    .values({
      userId,
      itemId,
      source: GACHA_CLAIM_SOURCE.ROLL,
      status: GACHA_CLAIM_STATUS.PENDING,
    })
    .returning({ id: gachaClaim.id });
  return row?.id ?? '';
};

beforeEach(async (): Promise<void> => {
  ({ db } = await sqliteDbCreate());
  await usersSeed(db);
  const itemId = await itemSeed(db, { name: 'Lanyard' });
  mineId = await claimSeed(FIXTURE_USER.id, itemId);
  otherId = await claimSeed(FIXTURE_OTHER_USER.id, itemId);
});

describe('gachaClaimRepo', () => {
  it("lists only the caller's own prizes with the item attached", async (): Promise<void> => {
    const page = await run(
      GachaClaimRepo.use((repo) => repo.listMine(FIXTURE_USER.id, PAGE))
    );

    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({
      id: mineId,
      item: { name: 'Lanyard' },
    });
  });

  it('lists every prize for an admin and searches by the winner', async (): Promise<void> => {
    const [all, found] = await run(
      GachaClaimRepo.use((repo) =>
        Effect.all([
          repo.list(PAGE),
          repo.list({ ...PAGE, search: FIXTURE_OTHER_USER.email }),
        ])
      )
    );

    expect(all.total).toBe(2);
    expect(A.map(found.items, (item) => item.id)).toEqual([otherId]);
    expect(found.items[0]?.user).toEqual(FIXTURE_OTHER_USER);
  });

  it('fulfils a pending prize once and records who did it', async (): Promise<void> => {
    const [first, second, row] = await run(
      GachaClaimRepo.use((repo) =>
        Effect.all([
          repo.fulfil(mineId, FIXTURE_OTHER_USER.id),
          repo.fulfil(mineId, FIXTURE_OTHER_USER.id),
          repo.findById(mineId),
        ])
      )
    );

    expect([first, second]).toEqual([true, false]);
    expect(row).toMatchObject({
      status: GACHA_CLAIM_STATUS.FULFILLED,
      fulfilledBy: FIXTURE_OTHER_USER.id,
    });
    expect(row?.fulfilledAt).toBeInstanceOf(Date);
  });
});
