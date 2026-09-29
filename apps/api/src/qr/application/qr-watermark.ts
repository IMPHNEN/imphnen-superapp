import { QR_MESSAGE } from '@app/messages';
import type { TQrWatermark, TQrWatermarkInput } from '@app/schemas';
import { Effect } from 'effect';
import { qrCampaignActiveFind } from '#/qr/application/qr-campaign-read.ts';
import type { TQrCampaignRepoId } from '#/qr/domain/qr-campaign.ts';
import {
  QR_IMAGE_MAX_BYTES,
  QR_IMAGE_TYPE,
  QR_OUTPUT_FILE_NAME,
  qrImageTypeAccepted,
} from '#/qr/domain/qr-rules.ts';
import {
  QrWatermarker,
  type TQrWatermarkerId,
} from '#/qr/domain/qr-watermarker.ts';
import {
  EBadRequest,
  type EDatabase,
  type ENotFound,
} from '#/shared/errors.ts';

const uploadBlobOf = (upload: TQrWatermarkInput['image']): Blob =>
  upload as unknown as Blob;

export const qrWatermark = Effect.fn('qrWatermark')(function* ({
  image,
}: TQrWatermarkInput): Effect.fn.Return<
  TQrWatermark,
  ENotFound | EBadRequest | EDatabase,
  TQrCampaignRepoId | TQrWatermarkerId
> {
  const watermarker = yield* QrWatermarker;

  if (!qrImageTypeAccepted(image.type)) {
    return yield* new EBadRequest({
      message: QR_MESSAGE.IMAGE_TYPE_UNSUPPORTED,
    });
  }

  if (image.size > QR_IMAGE_MAX_BYTES) {
    return yield* new EBadRequest({ message: QR_MESSAGE.IMAGE_TOO_LARGE });
  }

  const campaign = yield* qrCampaignActiveFind();
  const bytes = yield* Effect.promise(
    (): Promise<ArrayBuffer> => uploadBlobOf(image).arrayBuffer()
  );
  const output = yield* watermarker.watermark(
    new Uint8Array(bytes),
    campaign.url
  );

  return new File([output], QR_OUTPUT_FILE_NAME, { type: QR_IMAGE_TYPE.PNG });
});
