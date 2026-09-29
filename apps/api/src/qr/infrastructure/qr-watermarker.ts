import { PhotonImage, watermark } from '@cf-wasm/photon';
import { QR_MESSAGE } from '@app/messages';
import { Effect, Layer } from 'effect';
import {
  QR_IMAGE_MAX_PIXELS,
  QR_WATERMARK_MARGIN,
  qrWatermarkFits,
  qrWatermarkSize,
} from '#/qr/domain/qr-rules.ts';
import {
  QrWatermarker,
  type TQrWatermarker,
} from '#/qr/domain/qr-watermarker.ts';
import { qrPixels } from '#/qr/infrastructure/qr-pixels.ts';
import { EBadRequest } from '#/shared/errors.ts';

const imageDecode = (
  image: Uint8Array
): Effect.Effect<PhotonImage, EBadRequest> =>
  Effect.try({
    try: (): PhotonImage => PhotonImage.new_from_byteslice(image),
    catch: () => new EBadRequest({ message: QR_MESSAGE.IMAGE_INVALID }),
  });

const composite = (photo: PhotonImage, payload: string): Uint8Array => {
  const width = photo.get_width();
  const height = photo.get_height();
  const size = qrWatermarkSize(width, height);
  const qr = new PhotonImage(qrPixels(payload, size), size, size);
  watermark(
    photo,
    qr,
    BigInt(width - size - QR_WATERMARK_MARGIN),
    BigInt(height - size - QR_WATERMARK_MARGIN)
  );
  qr.free();
  return photo.get_bytes();
};

export const qrWatermarkerLayer = Layer.succeed(
  QrWatermarker,
  QrWatermarker.of({
    watermark: (image, payload): ReturnType<TQrWatermarker['watermark']> =>
      Effect.acquireUseRelease(
        imageDecode(image),
        (photo) =>
          Effect.gen(function* () {
            const width = photo.get_width();
            const height = photo.get_height();

            if (width * height > QR_IMAGE_MAX_PIXELS) {
              return yield* new EBadRequest({
                message: QR_MESSAGE.IMAGE_TOO_LARGE,
              });
            }

            if (!qrWatermarkFits(width, height)) {
              return yield* new EBadRequest({
                message: QR_MESSAGE.IMAGE_TOO_SMALL,
              });
            }

            return composite(photo, payload);
          }),
        (photo) => Effect.sync((): void => photo.free())
      ),
  })
);
