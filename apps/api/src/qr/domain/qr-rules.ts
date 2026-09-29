import { A } from '@mobily/ts-belt';

export const QR_CAMPAIGN_LIFETIME_DAYS = 30;
export const QR_ERROR_CORRECTION = 'M';
export const QR_QUIET_ZONE_MODULES = 4;
export const QR_WATERMARK_MIN_SIZE = 100;
export const QR_WATERMARK_SIZE_DIVISOR = 5;
export const QR_WATERMARK_MARGIN = 10;
export const QR_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const QR_IMAGE_MAX_PIXELS = 12_000_000;
export const QR_OUTPUT_FILE_NAME = 'qr-campaign.png';

export const QR_IMAGE_TYPE = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp',
} as const;

const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  QR_IMAGE_TYPE.PNG,
  QR_IMAGE_TYPE.JPEG,
  QR_IMAGE_TYPE.WEBP,
];

const DAY_MS = 86_400_000;

export const qrImageTypeAccepted = (type: string): boolean =>
  A.includes(ACCEPTED_IMAGE_TYPES, type);

export const qrCampaignDefaultExpiry = (now: Date): Date =>
  new Date(now.getTime() + QR_CAMPAIGN_LIFETIME_DAYS * DAY_MS);

export const qrCampaignExpired = (expiresAt: Date, now: Date): boolean =>
  expiresAt.getTime() <= now.getTime();

export const qrWatermarkSize = (width: number, height: number): number =>
  Math.max(
    Math.floor(Math.min(width, height) / QR_WATERMARK_SIZE_DIVISOR),
    QR_WATERMARK_MIN_SIZE
  );

export const qrWatermarkFits = (width: number, height: number): boolean =>
  Math.min(width, height) >=
  qrWatermarkSize(width, height) + QR_WATERMARK_MARGIN;
