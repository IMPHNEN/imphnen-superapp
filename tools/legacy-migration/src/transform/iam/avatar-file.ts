import { match, P } from 'ts-pattern';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TFileCopy,
  TMigrationOptions,
} from '../../pipeline/step-types.ts';
import { adjustmentOf } from '../../shared/step-output.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import {
  allowedExtension,
  FILE_EXTENSION,
  fileCopyOf,
  generatedKeyOf,
  legacyKeyOfUrl,
  publicUrlOf,
  s3Source,
  type TFileExtension,
  valueRef,
} from '../shared/legacy-file.ts';

export const AVATAR_KEY_PREFIX = 'profile/avatar';
const USER_IMAGE_COLUMN = 'image';
const AVATAR_KEY_COLUMN = 'avatar_key';
const AVATAR_EXTENSIONS = [
  FILE_EXTENSION.JPG,
  FILE_EXTENSION.JPEG,
  FILE_EXTENSION.PNG,
  FILE_EXTENSION.WEBP,
];

export type TAvatarPlan = {
  readonly image: string | null;
  readonly avatarKey: string | null;
  readonly files: readonly TFileCopy[];
  readonly adjustments: readonly TAdjustment[];
};

const unchanged = (image: string | null): TAvatarPlan => ({
  image,
  avatarKey: null,
  files: [],
  adjustments: [],
});

const unsupported = (
  userId: string,
  avatarUrl: string,
  legacyKey: string
): TAvatarPlan => ({
  ...unchanged(avatarUrl),
  adjustments: [
    adjustmentOf(
      LEGACY_TABLE.APP_USERS,
      userId,
      ADJUSTMENT_RULE.FILE_UNSUPPORTED,
      `avatar ${legacyKey} kept as a legacy URL`
    ),
  ],
});

const copied = (
  userId: string,
  avatarUrl: string,
  legacyKey: string,
  extension: TFileExtension,
  options: TMigrationOptions
): TAvatarPlan => {
  const key = generatedKeyOf(AVATAR_KEY_PREFIX, legacyKey, extension);
  const image = publicUrlOf(options.storagePublicUrl, key);
  return {
    image,
    avatarKey: key,
    files: [
      fileCopyOf(key, s3Source(legacyKey), [
        valueRef(
          TARGET_TABLE.USER,
          userId,
          USER_IMAGE_COLUMN,
          image,
          avatarUrl
        ),
        valueRef(
          TARGET_TABLE.USER_PROFILE,
          userId,
          AVATAR_KEY_COLUMN,
          key,
          null
        ),
      ]),
    ],
    adjustments: [
      adjustmentOf(
        LEGACY_TABLE.APP_USERS,
        userId,
        ADJUSTMENT_RULE.FILE_COPY_PLANNED,
        `${legacyKey} -> ${key}`
      ),
    ],
  };
};

export const avatarPlan = (
  userId: string,
  avatarUrl: string | null,
  options: TMigrationOptions
): TAvatarPlan =>
  match({
    avatarUrl,
    legacyKey:
      avatarUrl === null
        ? null
        : legacyKeyOfUrl(avatarUrl, options.legacyFileUrlPrefixes),
  })
    .with(
      { avatarUrl: P.string, legacyKey: P.string },
      (found): TAvatarPlan =>
        match(allowedExtension(found.legacyKey, AVATAR_EXTENSIONS))
          .with(
            P.nullish,
            (): TAvatarPlan =>
              unsupported(userId, found.avatarUrl, found.legacyKey)
          )
          .otherwise(
            (extension): TAvatarPlan =>
              copied(
                userId,
                found.avatarUrl,
                found.legacyKey,
                extension,
                options
              )
          )
    )
    .otherwise((): TAvatarPlan => unchanged(avatarUrl));
