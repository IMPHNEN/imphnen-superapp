import { A } from '@mobily/ts-belt';

const BYTES_PER_MEGABYTE = 1_048_576;

export const AVATAR_POLICY = {
  MAX_BYTES: 5 * BYTES_PER_MEGABYTE,
  HEADER_BYTES: 12,
  KEY_PREFIX: 'profile/avatar',
} as const;

export const AVATAR_MIME = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
} as const;

export type TAvatarMime = (typeof AVATAR_MIME)[keyof typeof AVATAR_MIME];

type TAvatarFormat = {
  readonly mime: TAvatarMime;
  readonly extension: string;
  readonly matches: (header: Uint8Array) => boolean;
};

const JPEG_MAGIC = [0xff, 0xd8, 0xff] as const;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46] as const;
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50] as const;
const WEBP_OFFSET = 8;

const startsWith = (
  header: Uint8Array,
  magic: readonly number[],
  offset = 0
): boolean =>
  A.every(
    A.mapWithIndex(
      magic,
      (index, byte): boolean => header[offset + index] === byte
    ),
    (same): boolean => same
  );

const AVATAR_FORMATS: readonly TAvatarFormat[] = [
  {
    mime: AVATAR_MIME.JPEG,
    extension: 'jpg',
    matches: (header): boolean => startsWith(header, JPEG_MAGIC),
  },
  {
    mime: AVATAR_MIME.PNG,
    extension: 'png',
    matches: (header): boolean => startsWith(header, PNG_MAGIC),
  },
  {
    mime: AVATAR_MIME.WEBP,
    extension: 'webp',
    matches: (header): boolean =>
      startsWith(header, RIFF_MAGIC) &&
      startsWith(header, WEBP_MAGIC, WEBP_OFFSET),
  },
];

export const avatarFormatOf = (mime: string): TAvatarFormat | null =>
  A.find(AVATAR_FORMATS, (format): boolean => format.mime === mime) ?? null;

export const avatarKeyOf = (format: TAvatarFormat, id: string): string =>
  `${AVATAR_POLICY.KEY_PREFIX}/${id}.${format.extension}`;
