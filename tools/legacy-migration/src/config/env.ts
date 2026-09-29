import { A } from '@mobily/ts-belt';

export const ENV = {
  LEGACY_DATABASE_URL: 'LEGACY_DATABASE_URL',
  LEGACY_FILE_URL_PREFIXES: 'LEGACY_FILE_URL_PREFIXES',
  STORAGE_PUBLIC_URL: 'STORAGE_PUBLIC_URL',
  LEGACY_S3_ENDPOINT: 'LEGACY_S3_ENDPOINT',
  LEGACY_S3_REGION: 'LEGACY_S3_REGION',
  LEGACY_S3_BUCKET: 'LEGACY_S3_BUCKET',
  LEGACY_S3_ACCESS_KEY_ID: 'LEGACY_S3_ACCESS_KEY_ID',
  LEGACY_S3_SECRET_ACCESS_KEY: 'LEGACY_S3_SECRET_ACCESS_KEY',
  R2_ENDPOINT: 'R2_ENDPOINT',
  R2_BUCKET: 'R2_BUCKET',
  R2_ACCESS_KEY_ID: 'R2_ACCESS_KEY_ID',
  R2_SECRET_ACCESS_KEY: 'R2_SECRET_ACCESS_KEY',
} as const;

export type TEnvKey = (typeof ENV)[keyof typeof ENV];

export const DEFAULT_STORAGE_PUBLIC_URL = 'https://cdn.imphnen.dev';
const LIST_SEPARATOR = ',';
const MISSING = 'missing environment variable';

const ALIASES: Partial<Record<TEnvKey, string>> = {
  LEGACY_S3_ACCESS_KEY_ID: 'LEGACY_S3_ACCESS_KEY',
  LEGACY_S3_SECRET_ACCESS_KEY: 'LEGACY_S3_SECRET_KEY',
};

export const envOptional = (key: TEnvKey): string | null => {
  const alias = ALIASES[key];
  const value =
    process.env[key] ?? (alias === undefined ? undefined : process.env[alias]);
  return value === undefined || value.trim() === '' ? null : value.trim();
};

export const envRequired = (key: TEnvKey): string => {
  const value = envOptional(key);
  if (value === null) {
    throw new Error(`${MISSING}: ${key}`);
  }
  return value;
};

export const envList = (key: TEnvKey): readonly string[] =>
  A.filter(
    A.map((envOptional(key) ?? '').split(LIST_SEPARATOR), (item): string =>
      item.trim()
    ),
    (item): boolean => item !== ''
  );
