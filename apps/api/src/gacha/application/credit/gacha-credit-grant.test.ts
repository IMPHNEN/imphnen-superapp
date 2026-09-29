import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { gachaCreditGrant } from '#/gacha/application/credit/gacha-credit-grant.ts';
import { gachaCreditMine } from '#/gacha/application/credit/gacha-credit-mine.ts';
import {
  GachaCreditRepo,
  type TGachaCreditRecipient,
  type TGachaCreditRepoId,
} from '#/gacha/domain/gacha-credit.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { ENotFound } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-01-01T00:00:00Z');

const recipient: TGachaCreditRecipient = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Member',
  email: 'member@test.app',
};

type TMocks = {
  findByUser: Mock;
  recipientFind: Mock;
  grant: Mock;
  insert: Mock;
};

const mocksBuild = (found: TGachaCreditRecipient | null): TMocks => ({
  findByUser: vi.fn().mockReturnValue(Effect.succeed(null)),
  recipientFind: vi.fn().mockReturnValue(Effect.succeed(found)),
  grant: vi.fn().mockReturnValue(
    Effect.succeed({
      userId: recipient.id,
      balance: 8,
      createdAt: NOW,
      updatedAt: NOW,
    })
  ),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TGachaCreditRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      GachaCreditRepo,
      GachaCreditRepo.of({
        findByUser: mocks.findByUser,
        recipientFind: mocks.recipientFind,
        grant: mocks.grant,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('gachaCreditGrant', () => {
  it('refuses to grant credits to a user that does not exist', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      gachaCreditGrant({ userId: recipient.id, amount: 5 }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('adds the credits to the recipient and records the grant', async (): Promise<void> => {
    const mocks = mocksBuild(recipient);

    const result = await Effect.runPromise(
      gachaCreditGrant({ userId: recipient.id, amount: 5 }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result).toEqual({
      userId: recipient.id,
      balance: 8,
      updatedAt: NOW.toISOString(),
    });
    expect(mocks.grant).toHaveBeenCalledWith(recipient.id, 5);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        action: ACTIVITY_ACTION.GACHA_CREDIT_GRANT,
        resourceId: recipient.id,
        metadata: {
          [ACTIVITY_DETAIL.EMAIL]: recipient.email,
          [ACTIVITY_DETAIL.LABEL]: 5,
        },
      })
    );
  });
});

describe('gachaCreditMine', () => {
  it('reports a zero balance for a user who never had credits', async (): Promise<void> => {
    const mocks = mocksBuild(recipient);

    const result = await Effect.runPromise(
      gachaCreditMine(recipient.id).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(result).toEqual({
      userId: recipient.id,
      balance: 0,
      updatedAt: null,
    });
    expect(mocks.findByUser).toHaveBeenCalledWith(recipient.id);
  });
});
