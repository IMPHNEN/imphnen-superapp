import { Effect, Layer } from 'effect';
import { type Mock, vi } from 'vitest';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  QrCampaignRepo,
  type TQrCampaignRepoId,
  type TQrCampaignRow,
} from '#/qr/domain/qr-campaign.ts';
import {
  QrWatermarker,
  type TQrWatermarkerId,
} from '#/qr/domain/qr-watermarker.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';

export const QR_TEST_NOW = new Date('2026-01-01T00:00:00Z');

export const qrCampaignRowOf = (expiresAt: Date): TQrCampaignRow => ({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Launch',
  url: 'https://imphnen.dev',
  qrImageKey: null,
  isActive: true,
  createdBy: '22222222-2222-4222-8222-222222222222',
  expiresAt,
  createdAt: QR_TEST_NOW,
  updatedAt: QR_TEST_NOW,
});

export type TQrMocks = {
  findById: Mock;
  findActive: Mock;
  createActive: Mock;
  activate: Mock;
  remove: Mock;
  watermark: Mock;
  storageRemove: Mock;
};

export const qrMocksBuild = (row: TQrCampaignRow | null): TQrMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(row)),
  findActive: vi.fn().mockReturnValue(Effect.succeed(row)),
  createActive: vi.fn().mockReturnValue(Effect.succeed(row)),
  activate: vi.fn().mockReturnValue(Effect.succeed(row)),
  remove: vi.fn().mockReturnValue(Effect.succeed(row)),
  watermark: vi.fn().mockReturnValue(Effect.succeed(new Uint8Array([1]))),
  storageRemove: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

export const qrLayerBuild = (
  mocks: TQrMocks
): Layer.Layer<
  TQrCampaignRepoId | TQrWatermarkerId | TStorageServiceId | TActivityRecorderId
> =>
  Layer.mergeAll(
    Layer.succeed(
      QrCampaignRepo,
      QrCampaignRepo.of({
        list: vi.fn(),
        findById: mocks.findById,
        findActive: mocks.findActive,
        createActive: mocks.createActive,
        activate: mocks.activate,
        remove: mocks.remove,
      })
    ),
    Layer.succeed(
      QrWatermarker,
      QrWatermarker.of({ watermark: mocks.watermark })
    ),
    Layer.succeed(
      StorageService,
      StorageService.of({
        put: vi.fn(),
        get: vi.fn(),
        remove: mocks.storageRemove,
        publicUrlOf: (key: string): string => key,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({
        insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      })
    )
  );
