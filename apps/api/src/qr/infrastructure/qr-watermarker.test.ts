import { PhotonImage } from '@cf-wasm/photon';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { QrWatermarker } from '#/qr/domain/qr-watermarker.ts';
import { qrWatermarkerLayer } from '#/qr/infrastructure/qr-watermarker.ts';
import { EBadRequest } from '#/shared/errors.ts';

const PAYLOAD = 'https://imphnen.dev';
const CHANNELS = 4;
const WHITE = 255;
const DARK = 0;
const WIDTH = 600;
const HEIGHT = 400;
const QR_SIZE = 100;
const MARGIN = 10;

const pngOf = (width: number, height: number): Uint8Array => {
  const image = new PhotonImage(
    new Uint8Array(width * height * CHANNELS).fill(WHITE),
    width,
    height
  );
  const bytes = image.get_bytes();
  image.free();
  return bytes;
};

const run = (image: Uint8Array): Effect.Effect<Uint8Array, EBadRequest> =>
  Effect.gen(function* () {
    const watermarker = yield* QrWatermarker;
    return yield* watermarker.watermark(image, PAYLOAD);
  }).pipe(Effect.provide(qrWatermarkerLayer));

describe('qrWatermarker', () => {
  it('stamps an opaque QR into the bottom-right corner', async (): Promise<void> => {
    const output = PhotonImage.new_from_byteslice(
      await Effect.runPromise(run(pngOf(WIDTH, HEIGHT)))
    );
    const pixels = output.get_raw_pixels();
    const cornerX = WIDTH - QR_SIZE - MARGIN;
    const cornerY = HEIGHT - QR_SIZE - MARGIN;
    const finderPixel = ((cornerY + 20) * WIDTH + cornerX + 20) * CHANNELS;

    expect(output.get_width()).toBe(WIDTH);
    expect(pixels[finderPixel]).toBe(DARK);
    expect(pixels[0]).toBe(WHITE);
    output.free();
  });

  it('refuses an image too small to hold the QR', async (): Promise<void> => {
    const error = await Effect.runPromise(
      run(pngOf(QR_SIZE, QR_SIZE)).pipe(Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });

  it('refuses bytes that are not an image', async (): Promise<void> => {
    const error = await Effect.runPromise(
      run(new Uint8Array([1, 2, 3])).pipe(Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });
});
