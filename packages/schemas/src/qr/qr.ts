import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';

export const QR_CAMPAIGN_NAME_MAX_LENGTH = 200;
export const QR_PAYLOAD_MAX_LENGTH = 2000;

export const qrCampaignSchema = baseSchema(z.uuid()).extend({
  name: z.string(),
  url: z.string(),
  qrImageUrl: z.string().nullable(),
  isActive: z.boolean(),
  isExpired: z.boolean(),
  createdBy: userIdSchema.nullable(),
  expiresAt: z.iso.datetime(),
});
export type TQrCampaign = TEntityOf<z.infer<typeof qrCampaignSchema>>;

export const qrActiveCampaignSchema = qrCampaignSchema.pick({
  id: true,
  name: true,
  url: true,
  qrImageUrl: true,
  expiresAt: true,
});
export type TQrActiveCampaign = z.infer<typeof qrActiveCampaignSchema>;

export const qrCampaignCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(QR_CAMPAIGN_NAME_MAX_LENGTH),
  url: z.url().max(QR_PAYLOAD_MAX_LENGTH),
  expiresAt: z.iso.datetime({ offset: true }).optional(),
});
export type TQrCampaignCreateInput = z.infer<
  typeof qrCampaignCreateInputSchema
>;

export const qrCampaignIdInputSchema = z.object({ id: z.uuid() });
export type TQrCampaignIdInput = z.infer<typeof qrCampaignIdInputSchema>;

export const qrCampaignListInputSchema = paginationSchema;
export type TQrCampaignListInput = z.infer<typeof qrCampaignListInputSchema>;

export const qrCampaignListSchema = paginated(qrCampaignSchema);
export type TQrCampaignList = z.infer<typeof qrCampaignListSchema>;

export const qrWatermarkInputSchema = z.object({ image: z.file() });
export type TQrWatermarkInput = z.infer<typeof qrWatermarkInputSchema>;

export const qrWatermarkSchema = z.file();
export type TQrWatermark = z.infer<typeof qrWatermarkSchema>;
