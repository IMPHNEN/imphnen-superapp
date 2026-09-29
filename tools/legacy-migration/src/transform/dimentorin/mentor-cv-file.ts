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
  s3Source,
  valueRef,
} from '../shared/legacy-file.ts';

export const MENTOR_CV_KEY_PREFIX = 'mentor/cv';
const CV_KEY_COLUMN = 'cv_key';
const CV_LEGACY_URL_COLUMN = 'cv_legacy_url';
const CV_EXTENSIONS = [
  FILE_EXTENSION.PDF,
  FILE_EXTENSION.JPG,
  FILE_EXTENSION.JPEG,
  FILE_EXTENSION.PNG,
  FILE_EXTENSION.WEBP,
];

export type TCvPlan = {
  readonly cvKey: string | null;
  readonly cvLegacyUrl: string | null;
  readonly files: readonly TFileCopy[];
  readonly adjustments: readonly TAdjustment[];
};

const kept = (
  cvUrl: string | null,
  adjustments: readonly TAdjustment[]
): TCvPlan => ({ cvKey: null, cvLegacyUrl: cvUrl, files: [], adjustments });

export const cvPlan = (
  mentorId: string,
  cvUrl: string | null,
  options: TMigrationOptions
): TCvPlan => {
  const legacyKey =
    cvUrl === null
      ? null
      : legacyKeyOfUrl(cvUrl, options.legacyFileUrlPrefixes);
  const extension =
    legacyKey === null ? null : allowedExtension(legacyKey, CV_EXTENSIONS);
  return match({ cvUrl, legacyKey, extension })
    .with(
      { cvUrl: P.string, legacyKey: P.string, extension: P.string },
      (found): TCvPlan => {
        const key = generatedKeyOf(
          MENTOR_CV_KEY_PREFIX,
          found.legacyKey,
          found.extension
        );
        return {
          cvKey: key,
          cvLegacyUrl: null,
          files: [
            fileCopyOf(key, s3Source(found.legacyKey), [
              valueRef(TARGET_TABLE.MENTOR, mentorId, CV_KEY_COLUMN, key, null),
              valueRef(
                TARGET_TABLE.MENTOR,
                mentorId,
                CV_LEGACY_URL_COLUMN,
                null,
                found.cvUrl
              ),
            ]),
          ],
          adjustments: [
            adjustmentOf(
              LEGACY_TABLE.APP_MENTORS,
              mentorId,
              ADJUSTMENT_RULE.FILE_COPY_PLANNED,
              `${found.legacyKey} -> ${key}`
            ),
          ],
        };
      }
    )
    .with(
      { legacyKey: P.string },
      (found): TCvPlan =>
        kept(cvUrl, [
          adjustmentOf(
            LEGACY_TABLE.APP_MENTORS,
            mentorId,
            ADJUSTMENT_RULE.FILE_UNSUPPORTED,
            `cv ${found.legacyKey} kept as a legacy URL`
          ),
        ])
    )
    .otherwise((): TCvPlan => kept(cvUrl, []));
};
