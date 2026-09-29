import { HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { match, P } from 'ts-pattern';
import type { TLegacyHackathonSubmission } from '../../legacy/legacy-hackathon-rows.ts';
import { jsonParse } from '../../shared/json-text.ts';

const LEGACY_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;
export const SUBMISSION_COLUMN = {
  PRESENTATION: 'presentation_url',
  SCREENSHOTS: 'screenshot_keys',
} as const;
const RANK: Record<string, number> = {
  [HACKATHON_SUBMISSION_STATUS.SUBMITTED]: 3,
  [HACKATHON_SUBMISSION_STATUS.PENDING]: 2,
  [HACKATHON_SUBMISSION_STATUS.DRAFT]: 1,
};

export const submissionStatusOf = (status: string): string =>
  match(status)
    .with(
      HACKATHON_SUBMISSION_STATUS.DRAFT,
      HACKATHON_SUBMISSION_STATUS.PENDING,
      HACKATHON_SUBMISSION_STATUS.SUBMITTED,
      (same): string => same
    )
    .with(
      LEGACY_STATUS.CONFIRMED,
      (): string => HACKATHON_SUBMISSION_STATUS.SUBMITTED
    )
    .with(
      LEGACY_STATUS.CANCELLED,
      (): string => HACKATHON_SUBMISSION_STATUS.DRAFT
    )
    .otherwise((): string => HACKATHON_SUBMISSION_STATUS.DRAFT);

const updatedOf = (row: TLegacyHackathonSubmission): number =>
  row.updated_at ?? row.created_at ?? 0;

export const submissionPreferred = (
  left: TLegacyHackathonSubmission,
  right: TLegacyHackathonSubmission
): number =>
  (RANK[submissionStatusOf(right.status)] ?? 0) -
    (RANK[submissionStatusOf(left.status)] ?? 0) ||
  updatedOf(right) - updatedOf(left);

export const screenshotsOf = (text: string | null): readonly string[] =>
  match(text === null ? null : jsonParse(text))
    .with(
      { ok: true, value: P.array(P.string) },
      (parsed): readonly string[] => parsed.value
    )
    .otherwise((): readonly string[] => []);
