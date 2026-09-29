import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { gachaRoll } from '#/gacha/application/roll/gacha-roll.ts';
import {
  GACHA_ROLL_OUTCOME,
  GachaRollRepo,
  type TGachaRollOutcome,
  type TGachaRollRepoId,
} from '#/gacha/domain/gacha-roll.ts';
import { GACHA_RULE } from '#/gacha/domain/gacha-rules.ts';
import { EBadRequest, EConflict } from '#/shared/errors.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-01-01T00:00:00Z');

const won: TGachaRollOutcome = {
  kind: GACHA_ROLL_OUTCOME.WON,
  balance: 2,
  claim: {
    id: '44444444-4444-4444-8444-444444444444',
    userId: USER_ID,
    source: GACHA_CLAIM_SOURCE.ROLL,
    status: GACHA_CLAIM_STATUS.PENDING,
    quantity: 1,
    fulfilledAt: null,
    fulfilledBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    item: { id: ITEM_ID, code: 'pin', name: 'Pin' },
  },
};

const outOfStock: TGachaRollOutcome = {
  kind: GACHA_ROLL_OUTCOME.OUT_OF_STOCK,
};

type TMocks = { candidates: Mock; commit: Mock };

const mocksBuild = (
  outcomes: readonly TGachaRollOutcome[],
  pool = [{ id: ITEM_ID, weight: 1 }]
): TMocks => ({
  candidates: vi.fn().mockReturnValue(Effect.succeed(pool)),
  commit: A.reduce(
    outcomes,
    vi.fn<() => Effect.Effect<TGachaRollOutcome>>() as Mock,
    (mock, outcome): Mock => mock.mockReturnValueOnce(Effect.succeed(outcome))
  ),
});

const layerBuild = (mocks: TMocks): Layer.Layer<TGachaRollRepoId> =>
  Layer.succeed(GachaRollRepo, GachaRollRepo.of(mocks));

describe('gachaRoll', () => {
  it('spends exactly the roll cost and returns the prize and the new balance', async (): Promise<void> => {
    const mocks = mocksBuild([won]);

    const result = await Effect.runPromise(
      gachaRoll(USER_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(mocks.commit).toHaveBeenCalledWith(
      USER_ID,
      ITEM_ID,
      GACHA_RULE.ROLL_COST
    );
    expect(result).toMatchObject({
      balance: 2,
      claim: { item: { id: ITEM_ID }, status: GACHA_CLAIM_STATUS.PENDING },
    });
  });

  it('fails without retrying when the credits do not cover the cost', async (): Promise<void> => {
    const mocks = mocksBuild([
      { kind: GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS },
    ]);

    const error = await Effect.runPromise(
      gachaRoll(USER_ID).pipe(Effect.provide(layerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
  });

  it('picks again when the prize ran out between the pick and the write', async (): Promise<void> => {
    const mocks = mocksBuild([outOfStock, won]);

    const result = await Effect.runPromise(
      gachaRoll(USER_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(result.balance).toBe(2);
    expect(mocks.candidates).toHaveBeenCalledTimes(2);
    expect(mocks.commit).toHaveBeenCalledTimes(2);
  });

  it('gives up cleanly after the bounded number of attempts', async (): Promise<void> => {
    const mocks = mocksBuild([outOfStock, outOfStock, outOfStock, won]);

    const error = await Effect.runPromise(
      gachaRoll(USER_ID).pipe(Effect.provide(layerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.commit).toHaveBeenCalledTimes(GACHA_RULE.ROLL_MAX_ATTEMPTS);
  });

  it('fails before touching credits when no prize can be won', async (): Promise<void> => {
    const mocks = mocksBuild([won], []);

    const error = await Effect.runPromise(
      gachaRoll(USER_ID).pipe(Effect.provide(layerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.commit).not.toHaveBeenCalled();
  });
});
