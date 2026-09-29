import { encode } from 'uqr';
import {
  QR_ERROR_CORRECTION,
  QR_QUIET_ZONE_MODULES,
} from '#/qr/domain/qr-rules.ts';

const CHANNELS = 4;
const DARK = 0;
const LIGHT = 255;
const OPAQUE = 255;

export const qrPixels = (payload: string, size: number): Uint8Array => {
  const { data } = encode(payload, {
    ecc: QR_ERROR_CORRECTION,
    border: QR_QUIET_ZONE_MODULES,
  });
  const modules = data.length;
  const pixels = new Uint8Array(size * size * CHANNELS);

  for (let y = 0; y < size; y += 1) {
    const row = data[Math.floor((y * modules) / size)] ?? [];
    for (let x = 0; x < size; x += 1) {
      const dark = row[Math.floor((x * modules) / size)] === true;
      const value = dark ? DARK : LIGHT;
      const offset = (y * size + x) * CHANNELS;
      pixels.set([value, value, value, OPAQUE], offset);
    }
  }

  return pixels;
};
