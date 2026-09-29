import { GACHA_ITEM_SORT, SORT_DIRECTION } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
} from '#/gacha/domain/gacha-item.ts';
import { gachaItemRepoLayer } from '#/gacha/infrastructure/gacha-item-repository.ts';
import {
  itemInput,
  itemSeed,
} from '#/gacha/infrastructure/testing/gacha-fixtures.ts';
import {
  sqliteDbCreate,
  sqliteDbLayer,
} from '#/gacha/infrastructure/testing/sqlite-d1.ts';
import type { TDb } from '#/platform/db/client.ts';
import { EConflict } from '#/shared/errors.ts';

let db: TDb;

const run = <A, E>(
  program: Effect.Effect<A, E, TGachaItemRepoId>
): Promise<A> =>
  Effect.runPromise(
    program.pipe(
      Effect.provide(gachaItemRepoLayer),
      Effect.provide(sqliteDbLayer(db))
    )
  );

const LIST_INPUT = {
  page: 1,
  pageSize: 20,
  sortBy: GACHA_ITEM_SORT.CODE,
  sortDir: SORT_DIRECTION.ASC,
};

beforeEach(async (): Promise<void> => {
  ({ db } = await sqliteDbCreate());
});

describe('gachaItemRepo', () => {
  it('refuses a duplicate code with EConflict', async (): Promise<void> => {
    await itemSeed(db, { code: 'pin' });

    const error = await run(
      GachaItemRepo.use((repo) => repo.create(itemInput({ code: 'pin' }))).pipe(
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
  });

  it('applies a partial update and returns the whole item', async (): Promise<void> => {
    const id = await itemSeed(db, { stock: 5, weight: 0.5 });

    const row = await run(
      GachaItemRepo.use((repo) => repo.update({ id, stock: 9 }))
    );

    expect(row).toMatchObject({ id, stock: 9, weight: 0.5, code: 'pin' });
  });

  it('does not update or delete an item that is already deleted', async (): Promise<void> => {
    const id = await itemSeed(db);

    const [deleted, again, updated, found] = await run(
      GachaItemRepo.use((repo) =>
        Effect.all([
          repo.softDelete(id),
          repo.softDelete(id),
          repo.update({ id, stock: 1 }),
          repo.findById(id),
        ])
      )
    );

    expect(deleted?.deletedAt).toBeInstanceOf(Date);
    expect([again, updated, found]).toEqual([null, null, null]);
  });

  it('lists live items only and searches by name or code', async (): Promise<void> => {
    await itemSeed(db, { code: 'sticker', name: 'Sticker Pack' });
    await itemSeed(db, { code: 'lanyard', name: 'Lanyard' });
    const gone = await itemSeed(db, { code: 'stick-gone', name: 'Old' });

    const page = await run(
      GachaItemRepo.use((repo) =>
        repo
          .softDelete(gone)
          .pipe(Effect.andThen(repo.list({ ...LIST_INPUT, search: 'stick' })))
      )
    );

    expect(page.total).toBe(1);
    expect(A.map(page.items, (item) => item.code)).toEqual(['sticker']);
  });
});
