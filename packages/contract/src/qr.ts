import {
  qrActiveCampaignSchema,
  qrCampaignCreateInputSchema,
  qrCampaignIdInputSchema,
  qrCampaignListInputSchema,
  qrCampaignListSchema,
  qrCampaignSchema,
  qrWatermarkInputSchema,
  qrWatermarkSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const qrContract = {
  campaignList: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.QR_CAMPAIGNS })
    .input(qrCampaignListInputSchema)
    .output(qrCampaignListSchema),

  campaignCreate: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.QR_CAMPAIGNS })
    .input(qrCampaignCreateInputSchema)
    .output(qrCampaignSchema),

  campaignActivate: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.QR_CAMPAIGN_ACTIVATE })
    .input(qrCampaignIdInputSchema)
    .output(qrCampaignSchema),

  campaignRemove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.QR_CAMPAIGN })
    .input(qrCampaignIdInputSchema)
    .output(qrCampaignIdInputSchema),

  activeCampaign: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.QR_CAMPAIGN_ACTIVE })
    .output(qrActiveCampaignSchema),

  watermark: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.QR_WATERMARK })
    .input(qrWatermarkInputSchema)
    .output(qrWatermarkSchema),
};
