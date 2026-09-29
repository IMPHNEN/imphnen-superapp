import {
  qrActiveCampaignSchema,
  qrCampaignSchema,
  type TQrActiveCampaign,
  type TQrCampaign,
} from '@app/schemas';
import type { TQrCampaignRow } from '#/qr/domain/qr-campaign.ts';
import { qrCampaignExpired } from '#/qr/domain/qr-rules.ts';

export type TPublicUrlOf = (key: string) => string;

const qrImageUrlOf = (
  row: TQrCampaignRow,
  publicUrlOf: TPublicUrlOf
): string | null =>
  row.qrImageKey === null ? null : publicUrlOf(row.qrImageKey);

export const toQrCampaignDto = (
  row: TQrCampaignRow,
  publicUrlOf: TPublicUrlOf,
  now: Date
): TQrCampaign =>
  qrCampaignSchema.parse({
    id: row.id,
    name: row.name,
    url: row.url,
    qrImageUrl: qrImageUrlOf(row, publicUrlOf),
    isActive: row.isActive,
    isExpired: qrCampaignExpired(row.expiresAt, now),
    createdBy: row.createdBy,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

export const toQrActiveCampaignDto = (
  row: TQrCampaignRow,
  publicUrlOf: TPublicUrlOf
): TQrActiveCampaign =>
  qrActiveCampaignSchema.parse({
    id: row.id,
    name: row.name,
    url: row.url,
    qrImageUrl: qrImageUrlOf(row, publicUrlOf),
    expiresAt: row.expiresAt.toISOString(),
  });
