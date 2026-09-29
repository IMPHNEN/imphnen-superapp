import { QR_MESSAGE } from '@app/messages';
import type {
  TQrActiveCampaign,
  TQrCampaignList,
  TQrCampaignListInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  toQrActiveCampaignDto,
  toQrCampaignDto,
} from '#/qr/application/to-qr-campaign-dto.ts';
import {
  QrCampaignRepo,
  type TQrCampaignRepoId,
  type TQrCampaignRow,
} from '#/qr/domain/qr-campaign.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const qrCampaignList = Effect.fn('qrCampaignList')(function* (
  input: TQrCampaignListInput
): Effect.fn.Return<
  TQrCampaignList,
  EDatabase,
  TQrCampaignRepoId | TStorageServiceId
> {
  const campaignRepo = yield* QrCampaignRepo;
  const storage = yield* StorageService;
  const now = new Date();
  const { items, total } = yield* campaignRepo.list(input);
  return {
    items: A.map(items, (row) =>
      toQrCampaignDto(row, storage.publicUrlOf, now)
    ),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});

export const qrCampaignActiveFind = Effect.fn('qrCampaignActiveFind')(
  function* (): Effect.fn.Return<
    TQrCampaignRow,
    ENotFound | EDatabase,
    TQrCampaignRepoId
  > {
    const campaignRepo = yield* QrCampaignRepo;
    const row = yield* campaignRepo.findActive(new Date());

    if (row === null) {
      return yield* new ENotFound({ message: QR_MESSAGE.NO_ACTIVE_CAMPAIGN });
    }

    return row;
  }
);

export const qrActiveCampaign = Effect.fn('qrActiveCampaign')(
  function* (): Effect.fn.Return<
    TQrActiveCampaign,
    ENotFound | EDatabase,
    TQrCampaignRepoId | TStorageServiceId
  > {
    const storage = yield* StorageService;
    const row = yield* qrCampaignActiveFind();
    return toQrActiveCampaignDto(row, storage.publicUrlOf);
  }
);
