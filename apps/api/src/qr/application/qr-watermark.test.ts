import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  qrCampaignRowOf,
  qrLayerBuild,
  qrMocksBuild,
} from '#/qr/application/qr-test-layer.ts';
import { qrWatermark } from '#/qr/application/qr-watermark.ts';
import { QR_IMAGE_MAX_BYTES, QR_IMAGE_TYPE } from '#/qr/domain/qr-rules.ts';
import { EBadRequest, ENotFound } from '#/shared/errors.ts';

const FUTURE = new Date('2999-01-01T00:00:00Z');
const PDF_TYPE = 'application/pdf';
const UPLOAD_NAME = 'photo';

const uploadOf = (type: string, size: number): File =>
  new File([new Uint8Array(size)], UPLOAD_NAME, { type });

describe('qrWatermark', () => {
  it('refuses a file that is not a supported image', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    const error = await Effect.runPromise(
      qrWatermark({ image: uploadOf(PDF_TYPE, 1) }).pipe(
        Effect.provide(qrLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.watermark).not.toHaveBeenCalled();
  });

  it('refuses an upload over the size limit', async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    const error = await Effect.runPromise(
      qrWatermark({
        image: uploadOf(QR_IMAGE_TYPE.PNG, QR_IMAGE_MAX_BYTES + 1),
      }).pipe(Effect.provide(qrLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });

  it('fails with ENotFound when no live campaign is active', async (): Promise<void> => {
    const mocks = qrMocksBuild(null);

    const error = await Effect.runPromise(
      qrWatermark({ image: uploadOf(QR_IMAGE_TYPE.PNG, 1) }).pipe(
        Effect.provide(qrLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });

  it("stamps the active campaign's URL and returns a PNG", async (): Promise<void> => {
    const mocks = qrMocksBuild(qrCampaignRowOf(FUTURE));

    const result = await Effect.runPromise(
      qrWatermark({ image: uploadOf(QR_IMAGE_TYPE.JPEG, 1) }).pipe(
        Effect.provide(qrLayerBuild(mocks))
      )
    );

    expect(mocks.watermark).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'https://imphnen.dev'
    );
    expect(result.type).toBe(QR_IMAGE_TYPE.PNG);
  });
});
