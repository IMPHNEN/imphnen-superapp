import { PERMISSION } from '@app/permissions';
import {
  implementer,
  permissionGuarded,
  sessionGuarded,
} from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { qrCampaignActivate } from '#/qr/application/qr-campaign-activate.ts';
import { qrCampaignCreate } from '#/qr/application/qr-campaign-create.ts';
import {
  qrActiveCampaign,
  qrCampaignList,
} from '#/qr/application/qr-campaign-read.ts';
import { qrCampaignRemove } from '#/qr/application/qr-campaign-remove.ts';
import { qrWatermark } from '#/qr/application/qr-watermark.ts';

const qrRouter = implementer.qr.router({
  campaignList: permissionGuarded(
    PERMISSION.QR_CAMPAIGN_READ
  ).qr.campaignList.handler(({ input, context }) =>
    effectRun(context.runtime, qrCampaignList(input))
  ),

  campaignCreate: permissionGuarded(
    PERMISSION.QR_CAMPAIGN_CREATE
  ).qr.campaignCreate.handler(({ input, context }) =>
    effectRun(context.runtime, qrCampaignCreate(input, context.session.user.id))
  ),

  campaignActivate: permissionGuarded(
    PERMISSION.QR_CAMPAIGN_UPDATE
  ).qr.campaignActivate.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      qrCampaignActivate(input, context.session.user.id)
    )
  ),

  campaignRemove: permissionGuarded(
    PERMISSION.QR_CAMPAIGN_DELETE
  ).qr.campaignRemove.handler(({ input, context }) =>
    effectRun(context.runtime, qrCampaignRemove(input, context.session.user.id))
  ),

  activeCampaign: sessionGuarded.qr.activeCampaign.handler(({ context }) =>
    effectRun(context.runtime, qrActiveCampaign())
  ),

  watermark: sessionGuarded.qr.watermark.handler(({ input, context }) =>
    effectRun(context.runtime, qrWatermark(input))
  ),
});

export type TQrRouter = typeof qrRouter;

export const qrRouterBuild = (): TQrRouter => qrRouter;
