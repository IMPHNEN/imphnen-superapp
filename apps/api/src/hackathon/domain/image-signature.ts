import { HACKATHON_IMAGE_TYPE, type THackathonImageType } from '@app/schemas';
import { A } from '@mobily/ts-belt';

type TSignature = {
  type: THackathonImageType;
  offset: number;
  bytes: readonly number[];
  also?: TSignature;
};

const GIF_VERSIONS: readonly number[] = [0x37, 0x39];

const SIGNATURES: readonly TSignature[] = [
  { type: HACKATHON_IMAGE_TYPE.JPEG, offset: 0, bytes: [0xff, 0xd8, 0xff] },
  {
    type: HACKATHON_IMAGE_TYPE.PNG,
    offset: 0,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    type: HACKATHON_IMAGE_TYPE.WEBP,
    offset: 0,
    bytes: [0x52, 0x49, 0x46, 0x46],
    also: {
      type: HACKATHON_IMAGE_TYPE.WEBP,
      offset: 8,
      bytes: [0x57, 0x45, 0x42, 0x50],
    },
  },
  ...A.map(
    GIF_VERSIONS,
    (version): TSignature => ({
      type: HACKATHON_IMAGE_TYPE.GIF,
      offset: 0,
      bytes: [0x47, 0x49, 0x46, 0x38, version, 0x61],
    })
  ),
];

export const IMAGE_SIGNATURE_LENGTH = 12;

const matches = (header: Uint8Array, signature: TSignature): boolean =>
  A.every(
    A.mapWithIndex(signature.bytes, (index, byte) => [index, byte] as const),
    ([index, byte]) => header[signature.offset + index] === byte
  ) &&
  (signature.also === undefined || matches(header, signature.also));

export const imageTypeOf = (header: Uint8Array): THackathonImageType | null =>
  A.find(SIGNATURES, (signature) => matches(header, signature))?.type ?? null;
