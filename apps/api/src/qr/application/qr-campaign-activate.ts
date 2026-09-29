import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { QR_MESSAGE } from '@app/messages';
import type { TQrCampaign, TQrCampaignIdInput } from '@app/schemas';
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
import { qrCampaignExpired } from '#/qr/domain/qr-rules.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EBadRequest, type EDatabase, ENotFound } from '#/shared/errors.ts';

export const qrCampaignActivate = Effect.fn('qrCampaignActivate')(function* (
  { id }: TQrCampaignIdInput,
  actorId: string
): Effect.fn.Return<
  TQrCampaign,
  ENotFound | EBadRequest | EDatabase,
  TQrCampaignRepoId | TStorageServiceId | TActivityRecorderId
> {
  const campaignRepo = yield* QrCampaignRepo;
  const storage = yield* StorageService;
  const activityRepo = yield* ActivityRecorder;
  const now = new Date();

  const existing = yield* campaignRepo.findById(id);

  if (existing === null) {
    return yield* new ENotFound({ message: QR_MESSAGE.CAMPAIGN_NOT_FOUND });
  }

  if (qrCampaignExpired(existing.expiresAt, now)) {
    return yield* new EBadRequest({ message: QR_MESSAGE.CAMPAIGN_EXPIRED });
  }

  const row = yield* campaignRepo.activate(id, now);

  if (row === null) {
    return yield* new ENotFound({ message: QR_MESSAGE.CAMPAIGN_NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.QR_CAMPAIGN_ACTIVATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.QR_CAMPAIGN,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: row.name }),
  });

  return toQrCampaignDto(row, storage.publicUrlOf, now);
});
