import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import {
  FILE_REF_MODE,
  FILE_SOURCE_KIND,
  type TFileCopy,
  type TFileRef,
  type TFileSource,
} from '../../pipeline/step-types.ts';
import { stableUuid } from '../../shared/stable-uuid.ts';
import type { TSqlValue } from '../../target/target-rows.ts';
import type { TTargetTable } from '../../target/target-table.ts';

const SCHEME_MARK = '://';
const QUERY_MARK = /[?#].*$/;
const TRAILING_SLASH = /\/+$/;
const PATH_SEPARATOR = '/';
const EXTENSION_MARK = '.';
const OCTET_STREAM = 'application/octet-stream';

export const FILE_EXTENSION = {
  JPG: 'jpg',
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
  GIF: 'gif',
  PDF: 'pdf',
} as const;

export type TFileExtension =
  (typeof FILE_EXTENSION)[keyof typeof FILE_EXTENSION];

const CONTENT_TYPE: Record<TFileExtension, string> = {
  [FILE_EXTENSION.JPG]: 'image/jpeg',
  [FILE_EXTENSION.JPEG]: 'image/jpeg',
  [FILE_EXTENSION.PNG]: 'image/png',
  [FILE_EXTENSION.WEBP]: 'image/webp',
  [FILE_EXTENSION.GIF]: 'image/gif',
  [FILE_EXTENSION.PDF]: 'application/pdf',
};

export const isBareKey = (value: string): boolean =>
  !value.includes(SCHEME_MARK);

export const legacyKeyOfUrl = (
  url: string,
  prefixes: readonly string[]
): string | null => {
  const prefix = A.find(prefixes, (candidate): boolean =>
    url.startsWith(candidate)
  );
  return prefix === undefined || prefix === null
    ? null
    : url.slice(prefix.length).replace(QUERY_MARK, '');
};

export const basenameOf = (key: string): string =>
  A.last(key.replace(QUERY_MARK, '').split(PATH_SEPARATOR)) ?? key;

export const extensionOf = (key: string): string | null => {
  const base = basenameOf(key);
  const index = base.lastIndexOf(EXTENSION_MARK);
  return index <= 0 ? null : base.slice(index + 1).toLowerCase();
};

export const allowedExtension = (
  key: string,
  allowed: readonly TFileExtension[]
): TFileExtension | null => {
  const extension = extensionOf(key);
  return (
    A.find(allowed, (candidate): boolean => candidate === extension) ?? null
  );
};

export const normalisedExtension = (extension: TFileExtension): string =>
  extension === FILE_EXTENSION.JPEG ? FILE_EXTENSION.JPG : extension;

export const contentTypeOf = (key: string): string =>
  match(extensionOf(key))
    .with(
      P.string,
      (extension): string =>
        D.get(CONTENT_TYPE, extension as TFileExtension) ?? OCTET_STREAM
    )
    .otherwise((): string => OCTET_STREAM);

export const publicUrlOf = (base: string, key: string): string =>
  `${base.replace(TRAILING_SLASH, '')}${PATH_SEPARATOR}${key}`;

export const generatedKeyOf = (
  prefix: string,
  identity: string,
  extension: TFileExtension
): string =>
  `${prefix}${PATH_SEPARATOR}${stableUuid(`${prefix}|${identity}`)}.${normalisedExtension(extension)}`;

export const valueRef = (
  table: TTargetTable,
  key: string,
  column: string,
  stored: TSqlValue,
  fallback: TSqlValue
): TFileRef => ({
  table,
  key,
  column,
  mode: FILE_REF_MODE.VALUE,
  stored,
  fallback,
});

export const arrayRef = (
  table: TTargetTable,
  key: string,
  column: string,
  stored: string
): TFileRef => ({
  table,
  key,
  column,
  mode: FILE_REF_MODE.ARRAY,
  stored,
  fallback: null,
});

export const fileCopyOf = (
  targetKey: string,
  source: TFileSource,
  refs: readonly TFileRef[]
): TFileCopy => ({
  targetKey,
  contentType: contentTypeOf(targetKey),
  source,
  refs,
});

export const s3Source = (key: string): TFileSource => ({
  kind: FILE_SOURCE_KIND.S3,
  key,
});

export const urlSource = (url: string): TFileSource => ({
  kind: FILE_SOURCE_KIND.URL,
  url,
});
