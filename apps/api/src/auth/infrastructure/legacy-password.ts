import { argon2idAsync } from '@noble/hashes/argon2.js';
import { A, D } from '@mobily/ts-belt';
import { constantTimeEqual } from 'better-auth/crypto';
import { match, P } from 'ts-pattern';

export const LEGACY_HASH_PREFIX = '$argon2id$';

const PHC_SEPARATOR = '$';
const PARAM_SEPARATOR = ',';
const PARAM_ASSIGN = '=';
const BASE64_BLOCK = 4;
const BASE64_PAD = '=';
const PARAM_KEY = {
  VERSION: 'v',
  MEMORY: 'm',
  TIME: 't',
  PARALLELISM: 'p',
} as const;

type TLegacyHash = {
  version: number;
  memory: number;
  time: number;
  parallelism: number;
  salt: Uint8Array;
  digest: Uint8Array;
};

type TParams = Readonly<Record<string, number>>;

export const isLegacyHash = (hash: string): boolean =>
  hash.startsWith(LEGACY_HASH_PREFIX);

const base64Decode = (value: string): Uint8Array => {
  const padding = (BASE64_BLOCK - (value.length % BASE64_BLOCK)) % BASE64_BLOCK;
  const binary = atob(`${value}${BASE64_PAD.repeat(padding)}`);
  return Uint8Array.from(binary, (char): number => char.charCodeAt(0));
};

const paramsOf = (segment: string): TParams =>
  D.fromPairs(
    A.map(segment.split(PARAM_SEPARATOR), (pair): readonly [string, number] => {
      const [key = '', value = ''] = pair.split(PARAM_ASSIGN);
      return [key, Number(value)] as const;
    })
  );

const legacyHashParse = (hash: string): TLegacyHash | null => {
  const [, , versionPart = '', paramPart = '', salt = '', digest = ''] =
    hash.split(PHC_SEPARATOR);
  const params = { ...paramsOf(versionPart), ...paramsOf(paramPart) };
  const parsed = {
    version: params[PARAM_KEY.VERSION],
    memory: params[PARAM_KEY.MEMORY],
    time: params[PARAM_KEY.TIME],
    parallelism: params[PARAM_KEY.PARALLELISM],
  };
  return match(parsed)
    .with(
      {
        version: P.number.int(),
        memory: P.number.int().positive(),
        time: P.number.int().positive(),
        parallelism: P.number.int().positive(),
      },
      (found): TLegacyHash | null =>
        salt === '' || digest === ''
          ? null
          : {
              ...found,
              salt: base64Decode(salt),
              digest: base64Decode(digest),
            }
    )
    .otherwise((): null => null);
};

const digestMatches = async (
  parsed: TLegacyHash,
  password: string
): Promise<boolean> => {
  const computed = await argon2idAsync(password, parsed.salt, {
    t: parsed.time,
    m: parsed.memory,
    p: parsed.parallelism,
    version: parsed.version,
    dkLen: parsed.digest.length,
  });
  return constantTimeEqual(computed, parsed.digest);
};

export const legacyPasswordVerify = (
  hash: string,
  password: string
): Promise<boolean> => {
  const parsed = legacyHashParse(hash);
  return parsed === null
    ? Promise.resolve(false)
    : digestMatches(parsed, password);
};
