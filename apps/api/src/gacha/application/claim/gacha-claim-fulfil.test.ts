import { ACTIVITY_ACTION } from '@app/activity';
import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { gachaClaimFulfil } from '#/gacha/application/claim/gacha-claim-fulfil.ts';
import {
  GachaClaimRepo,
  type TGachaClaimAdminRow,
  type TGachaClaimRepoId,
} from '#/gacha/domain/gacha-claim.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EConflict, ENotFound } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CLAIM_ID = '44444444-4444-4444-8444-444444444444';
const NOW = new Date('2026-01-01T00:00:00Z');

const row: TGachaClaimAdminRow = {
  id: CLAIM_ID,
  userId: '11111111-1111-4111-8111-111111111111',
  source: GACHA_CLAIM_SOURCE.ROLL,
  status: GACHA_CLAIM_STATUS.FULFILLED,
  quantity: 1,
  fulfilledAt: NOW,
  fulfilledBy: ACTOR_ID,
  createdAt: NOW,
  updatedAt: NOW,
  item: {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'pin',
    name: 'Pin',
  },
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Member',
    email: 'member@test.app',
  },
};

type TMocks = { fulfil: Mock; findById: Mock; insert: Mock };

const mocksBuild = (
  fulfilled: boolean,
  found: TGachaClaimAdminRow | null
): TMocks => ({
  fulfil: vi.fn().mockReturnValue(Effect.succeed(fulfilled)),
  findById: vi.fn().mockReturnValue(Effect.succeed(found)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TGachaClaimRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      GachaClaimRepo,
      GachaClaimRepo.of({
        listMine: vi.fn(),
        list: vi.fn(),
        findById: mocks.findById,
        fulfil: mocks.fulfil,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

const fulfil = (mocks: TMocks): Promise<unknown> =>
  Effect.runPromise(
    gachaClaimFulfil({ id: CLAIM_ID }, ACTOR_ID).pipe(
      Effect.provide(layerBuild(mocks)),
      Effect.flip
    )
  );

describe('gachaClaimFulfil', () => {
  it('fails with ENotFound for an unknown prize', async (): Promise<void> => {
    const mocks = mocksBuild(false, null);

    expect(await fulfil(mocks)).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('refuses to fulfil a prize twice', async (): Promise<void> => {
    const mocks = mocksBuild(false, row);

    expect(await fulfil(mocks)).toBeInstanceOf(EConflict);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('marks the prize fulfilled by the actor and logs it', async (): Promise<void> => {
    const mocks = mocksBuild(true, row);

    const result = await Effect.runPromise(
      gachaClaimFulfil({ id: CLAIM_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.fulfil).toHaveBeenCalledWith(CLAIM_ID, ACTOR_ID);
    expect(result).toMatchObject({
      status: GACHA_CLAIM_STATUS.FULFILLED,
      fulfilledBy: ACTOR_ID,
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.GACHA_CLAIM_FULFIL })
    );
  });
});
