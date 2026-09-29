import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { QR_MESSAGE } from '@app/messages';
import type { TQrCampaign, TQrCampaignCreateInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { toQrCampaignDto } from '#/qr/application/to-qr-campaign-dto.ts';
import {
  QrCampaignRepo,
  type TQrCampaignRepoId,
} from '#/qr/domain/qr-campaign.ts';
import {
  qrCampaignDefaultExpiry,
  qrCampaignExpired,
} from '#/qr/domain/qr-rules.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EBadRequest, type EDatabase } from '#/shared/errors.ts';

export const qrCampaignCreate = Effect.fn('qrCampaignCreate')(function* (
  input: TQrCampaignCreateInput,
  actorId: string
): Effect.fn.Return<
  TQrCampaign,
  EBadRequest | EDatabase,
  TQrCampaignRepoId | TStorageServiceId | TActivityRecorderId
> {
  const campaignRepo = yield* QrCampaignRepo;
  const storage = yield* StorageService;
  const activityRepo = yield* ActivityRecorder;
  const now = new Date();

  const expiresAt =
    input.expiresAt === undefined
      ? qrCampaignDefaultExpiry(now)
      : new Date(input.expiresAt);

  if (qrCampaignExpired(expiresAt, now)) {
    return yield* new EBadRequest({ message: QR_MESSAGE.EXPIRY_IN_PAST });
  }

  const row = yield* campaignRepo.createActive({
    name: input.name,
    url: input.url,
    createdBy: actorId,
    expiresAt,
  });

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.QR_CAMPAIGN_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.QR_CAMPAIGN,
    resourceId: row.id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: row.name }),
  });

  return toQrCampaignDto(row, storage.publicUrlOf, now);
});
