import { describe, expect, it } from 'vitest';
import {
  qrCampaignDefaultExpiry,
  qrCampaignExpired,
  qrWatermarkFits,
  qrWatermarkSize,
} from '#/qr/domain/qr-rules.ts';

const NOW = new Date('2026-01-01T00:00:00Z');

describe('qr rules', () => {
  it('expires a campaign 30 days after it is created by default', (): void => {
    expect(qrCampaignDefaultExpiry(NOW).toISOString()).toBe(
      '2026-01-31T00:00:00.000Z'
    );
  });

  it('treats a campaign as expired from its expiry instant on', (): void => {
    expect(qrCampaignExpired(NOW, NOW)).toBe(true);
    expect(qrCampaignExpired(new Date('2026-01-02T00:00:00Z'), NOW)).toBe(
      false
    );
  });

  it('sizes the QR at a fifth of the short side with a 100px floor', (): void => {
    expect(qrWatermarkSize(2000, 1000)).toBe(200);
    expect(qrWatermarkSize(300, 300)).toBe(100);
  });

  it('refuses images too small for the QR and its margin', (): void => {
    expect(qrWatermarkFits(109, 500)).toBe(false);
    expect(qrWatermarkFits(110, 500)).toBe(true);
  });
});
