import { createHash } from 'node:crypto';
import { A } from '@mobily/ts-belt';

const NAMESPACE = 'b3d7c0f2-6a57-4c8e-9a4e-1d2f3c4b5a69';
const HASH = 'sha1';
const HEX = 'hex';
const DASH = '-';
const VERSION_FIVE = 0x50;
const VARIANT_RFC = 0x80;
const LOW_NIBBLE = 0x0f;
const LOW_SIX_BITS = 0x3f;
const UUID_BYTES = 16;
const VERSION_BYTE = 6;
const VARIANT_BYTE = 8;
const GROUPS = [8, 4, 4, 4, 12] as const;

const namespaceBytes = (): Buffer =>
  Buffer.from(NAMESPACE.replaceAll(DASH, ''), HEX);

type TSplit = { readonly parts: readonly string[]; readonly offset: number };

const formatUuid = (hex: string): string =>
  A.join(
    A.reduce(
      GROUPS,
      { parts: [], offset: 0 } as TSplit,
      (acc, size): TSplit => ({
        parts: A.append(acc.parts, hex.slice(acc.offset, acc.offset + size)),
        offset: acc.offset + size,
      })
    ).parts,
    DASH
  );

export const stableUuid = (name: string): string => {
  const digest = createHash(HASH)
    .update(namespaceBytes())
    .update(name)
    .digest()
    .subarray(0, UUID_BYTES);
  digest[VERSION_BYTE] = (digest[VERSION_BYTE] & LOW_NIBBLE) | VERSION_FIVE;
  digest[VARIANT_BYTE] = (digest[VARIANT_BYTE] & LOW_SIX_BITS) | VARIANT_RFC;
  return formatUuid(digest.toString(HEX));
};
