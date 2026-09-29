import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { GACHA_MESSAGE } from '@app/messages';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { gachaItemUpdate } from '#/gacha/application/item/gacha-item-update.ts';
import {
  GachaItemRepo,
  type TGachaItemRepoId,
  type TGachaItemRow,
} from '#/gacha/domain/gacha-item.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EConflict, ENotFound } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-01-01T00:00:00Z');

const row: TGachaItemRow = {
  id: ITEM_ID,
  code: 'pin',
  name: 'Pin',
  description: '',
  rarity: 'common',
  type: 'physical',
  category: 'merchandise',
  value: 0,
  weight: 0.5,
  stock: 9,
  isLimited: false,
  metadata: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

type TMocks = { update: Mock; insert: Mock };

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TGachaItemRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      GachaItemRepo,
      GachaItemRepo.of({
        list: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: mocks.update,
        softDelete: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('gachaItemUpdate', () => {
  it('applies a partial change and returns the full item with stock and weight', async (): Promise<void> => {
    const mocks = {
      update: vi.fn().mockReturnValue(Effect.succeed(row)),
      insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
    };

    const result = await Effect.runPromise(
      gachaItemUpdate({ id: ITEM_ID, stock: 9 }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.update).toHaveBeenCalledWith({ id: ITEM_ID, stock: 9 });
    expect(result).toMatchObject({ id: ITEM_ID, stock: 9, weight: 0.5 });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.GACHA_ITEM_UPDATE,
        metadata: {
          [ACTIVITY_DETAIL.NAME]: row.name,
          [ACTIVITY_DETAIL.CHANGED_FIELDS]: 'stock',
        },
      })
    );
  });

  it('fails with ENotFound for a missing or deleted item', async (): Promise<void> => {
    const mocks = {
      update: vi.fn().mockReturnValue(Effect.succeed(null)),
      insert: vi.fn(),
    };

    const error = await Effect.runPromise(
      gachaItemUpdate({ id: ITEM_ID, stock: 1 }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('passes a duplicate code through as EConflict', async (): Promise<void> => {
    const mocks = {
      update: vi
        .fn()
        .mockReturnValue(
          Effect.fail(new EConflict({ message: GACHA_MESSAGE.ITEM_CODE_TAKEN }))
        ),
      insert: vi.fn(),
    };

    const error = await Effect.runPromise(
      gachaItemUpdate({ id: ITEM_ID, code: 'taken' }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
