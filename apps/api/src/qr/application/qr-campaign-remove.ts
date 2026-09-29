import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { QR_MESSAGE } from '@app/messages';
import type { TQrCampaignIdInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  QrCampaignRepo,
  type TQrCampaignRepoId,
} from '#/qr/domain/qr-campaign.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound, type EStorage } from '#/shared/errors.ts';

export const qrCampaignRemove = Effect.fn('qrCampaignRemove')(function* (
  { id }: TQrCampaignIdInput,
  actorId: string
): Effect.fn.Return<
  TQrCampaignIdInput,
  ENotFound | EDatabase | EStorage,
  TQrCampaignRepoId | TStorageServiceId | TActivityRecorderId
> {
  const campaignRepo = yield* QrCampaignRepo;
  const storage = yield* StorageService;
  const activityRepo = yield* ActivityRecorder;

  const row = yield* campaignRepo.remove(id);

  if (row === null) {
    return yield* new ENotFound({ message: QR_MESSAGE.CAMPAIGN_NOT_FOUND });
  }

  if (row.qrImageKey !== null) {
    yield* storage.remove(row.qrImageKey);
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.QR_CAMPAIGN_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.QR_CAMPAIGN,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: row.name }),
  });

  return { id };
});
