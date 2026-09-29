import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { qrCampaignActivate } from '#/qr/application/qr-campaign-activate.ts';
import { qrCampaignCreate } from '#/qr/application/qr-campaign-create.ts';
import {
  QR_TEST_NOW,
  qrCampaignRowOf,
  qrLayerBuild,
  qrMocksBuild,
} from '#/qr/application/qr-test-layer.ts';
import { EBadRequest, ENotFound } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';
const FUTURE = new Date('2026-02-01T00:00:00Z');
const PAST = new Date('2025-12-01T00:00:00Z');

beforeEach((): void => {
  vi.useFakeTimers();
  vi.setSystemTime(QR_TEST_NOW);
});

afterEach((): void => {
  vi.useRealTimers();
});

describe('qrCampaignCreate', () => {
  it('creates the campaign as the only active one, expiring in 30 days', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    await Effect.runPromise(
      qrCampaignCreate(
        { name: 'Launch', url: 'https://imphnen.dev' },
        ACTOR_ID
      ).pipe(Effect.provide(qrLayerBuild(mocks)))
    );

    expect(mocks.createActive).toHaveBeenCalledWith({
      name: 'Launch',
      url: 'https://imphnen.dev',
      createdBy: ACTOR_ID,
      expiresAt: new Date('2026-01-31T00:00:00Z'),
    });
  });

  it('refuses an expiry in the past', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    const error = await Effect.runPromise(
      qrCampaignCreate(
        {
          name: 'Launch',
          url: 'https://imphnen.dev',
          expiresAt: PAST.toISOString(),
        },
        ACTOR_ID
      ).pipe(Effect.provide(qrLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.createActive).not.toHaveBeenCalled();
  });
});

describe('qrCampaignActivate', () => {
  it('fails with ENotFound instead of deactivating everything for a missing id', async (): Promise<void> => {
    const mocks = qrMocksBuild(null);

    const error = await Effect.runPromise(
      qrCampaignActivate({ id: CAMPAIGN_ID }, ACTOR_ID).pipe(
        Effect.provide(qrLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it('refuses to activate an expired campaign', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(PAST));

    const error = await Effect.runPromise(
      qrCampaignActivate({ id: CAMPAIGN_ID }, ACTOR_ID).pipe(
        Effect.provide(qrLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it('activates a live campaign', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    const result = await Effect.runPromise(
      qrCampaignActivate({ id: CAMPAIGN_ID }, ACTOR_ID).pipe(
        Effect.provide(qrLayerBuild(mocks))
      )
    );

    expect(mocks.activate).toHaveBeenCalledWith(CAMPAIGN_ID, QR_TEST_NOW);
    expect(result).toMatchObject({ isActive: true, isExpired: false });
  });
});
