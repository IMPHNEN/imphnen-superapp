import { Context, type Effect } from 'effect';
import type { EBadRequest } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TQrWatermarker = {
  watermark: (
    image: Uint8Array,
    payload: string
  ) => Effect.Effect<Uint8Array, EBadRequest>;
};

export type TQrWatermarkerId = TServiceId<typeof REPO_TAG.QR_WATERMARKER>;

export const QrWatermarker = Context.Service<TQrWatermarkerId, TQrWatermarker>(
  REPO_TAG.QR_WATERMARKER
);
