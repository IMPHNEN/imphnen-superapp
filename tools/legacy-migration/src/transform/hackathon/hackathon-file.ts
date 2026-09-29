import { match, P } from 'ts-pattern';
import type {
  TFileCopy,
  TFileRef,
  TMigrationOptions,
} from '../../pipeline/step-types.ts';
import {
  allowedExtension,
  basenameOf,
  FILE_EXTENSION,
  fileCopyOf,
  generatedKeyOf,
  isBareKey,
  legacyKeyOfUrl,
  publicUrlOf,
  s3Source,
  urlSource,
} from '../shared/legacy-file.ts';
import { blankToNull } from '../../shared/text.ts';

export const HACKATHON_FILE_PREFIX = {
  AVATAR: 'hackathon/avatar',
  TEAM: 'hackathon/team',
  SUBMISSION: 'hackathon/submission',
} as const;

const PATH_SEPARATOR = '/';
const IMAGE_EXTENSIONS = [
  FILE_EXTENSION.JPG,
  FILE_EXTENSION.JPEG,
  FILE_EXTENSION.PNG,
  FILE_EXTENSION.WEBP,
  FILE_EXTENSION.GIF,
];

export type THackathonFile = {
  readonly stored: string | null;
  readonly file: TFileCopy | null;
};

type TRefOf = (stored: string) => TFileRef;

const legacyKeyOf = (
  value: string | null,
  options: TMigrationOptions
): string | null =>
  match(value)
    .with(P.nullish, (): null => null)
    .when(isBareKey, (key): string => key)
    .otherwise((url): string | null =>
      legacyKeyOfUrl(url, options.legacyFileUrlPrefixes)
    );

const copiedKey = (prefix: string, legacyKey: string): string =>
  `${prefix}${PATH_SEPARATOR}${basenameOf(legacyKey)}`;

const EMPTY: THackathonFile = { stored: null, file: null };

export const hackathonKeyFile = (
  value: string | null,
  prefix: string,
  refOf: TRefOf,
  options: TMigrationOptions
): THackathonFile =>
  match({
    value: blankToNull(value),
    legacyKey: legacyKeyOf(blankToNull(value), options),
  })
    .with({ legacyKey: P.string }, (found): THackathonFile => {
      const key = copiedKey(prefix, found.legacyKey);
      return {
        stored: key,
        file: fileCopyOf(key, s3Source(found.legacyKey), [refOf(key)]),
      };
    })
    .with(
      { value: P.string },
      (found): THackathonFile =>
        match(allowedExtension(found.value, IMAGE_EXTENSIONS))
          .with(P.nullish, (): THackathonFile => EMPTY)
          .otherwise((extension): THackathonFile => {
            const key = generatedKeyOf(prefix, found.value, extension);
            return {
              stored: key,
              file: fileCopyOf(key, urlSource(found.value), [refOf(key)]),
            };
          })
    )
    .otherwise((): THackathonFile => EMPTY);

export const hackathonUrlFile = (
  value: string | null,
  prefix: string,
  refOf: TRefOf,
  options: TMigrationOptions
): THackathonFile =>
  match({
    value: blankToNull(value),
    legacyKey: legacyKeyOf(blankToNull(value), options),
  })
    .with({ legacyKey: P.string }, (found): THackathonFile => {
      const key = copiedKey(prefix, found.legacyKey);
      const url = publicUrlOf(options.storagePublicUrl, key);
      return {
        stored: url,
        file: fileCopyOf(key, s3Source(found.legacyKey), [refOf(url)]),
      };
    })
    .otherwise(
      (found): THackathonFile => ({ stored: found.value, file: null })
    );
