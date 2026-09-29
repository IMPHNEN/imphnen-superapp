import { A } from '@mobily/ts-belt';
import type { TLegacyMentor, TLegacyUser } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TMigrationOptions,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { stringArrayText } from '../../shared/json-text.ts';
import { stableUuid } from '../../shared/stable-uuid.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import { emptyToNull } from '../../shared/text.ts';
import type { TMentorRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import {
  metadataRecordOf,
  type TProfileTextKey,
} from '../iam/profile-metadata.ts';
import { cvPlan } from './mentor-cv-file.ts';
import {
  menteeLevelText,
  mentorStatusOf,
  metadataTextOf,
} from './mentor-fields.ts';

const MENTOR_ID_NAMESPACE = 'mentor|';

export const mentorIdOf = (mentor: TLegacyMentor): string =>
  mentor.id ?? stableUuid(`${MENTOR_ID_NAMESPACE}${mentor.user_id}`);

const mentorOutput = (
  mentor: TLegacyMentor,
  owner: TLegacyUser | undefined,
  options: TMigrationOptions
): TStepOutput => {
  const id = mentorIdOf(mentor);
  const meta = metadataRecordOf(owner?.metadata ?? null);
  const text = (key: TProfileTextKey): string | null =>
    metadataTextOf(meta[key]);
  const status = mentorStatusOf(mentor.status);
  const cv = cvPlan(id, text('cv_url'), options);
  const row: TMentorRow = {
    id,
    user_id: mentor.user_id,
    status: status.status,
    legal_name: null,
    gender: text('gender'),
    domicile: text('domicile'),
    location: text('location'),
    phone_number: text('phone_number'),
    phone_for_verification: text('phone_for_verification'),
    bio: text('bio'),
    last_education: text('last_education'),
    linkedin_url: text('linkedin_url'),
    github_url: text('github_url'),
    portfolio_url: text('portfolio_url'),
    twitter_url: text('twitter_url'),
    identity_document_key: null,
    cv_key: cv.cvKey,
    cv_legacy_url: cv.cvLegacyUrl,
    industries: stringArrayText(mentor.industries),
    expertise: stringArrayText(mentor.expertise),
    languages: stringArrayText(mentor.languages),
    current_company: emptyToNull(mentor.current_company),
    current_role: emptyToNull(mentor.current_role),
    years_of_experience: mentor.years_of_experience,
    topics_of_interest: stringArrayText(mentor.topics_of_interest),
    preferred_mentee_level: menteeLevelText(mentor.preferred_mentee_level),
    preferred_mentoring_formats: stringArrayText(
      mentor.preferred_mentoring_formats
    ),
    availability_commitment: emptyToNull(mentor.availability_commitment),
    mentoring_rate:
      mentor.mentoring_rate === null ? null : Math.round(mentor.mentoring_rate),
    review_note: null,
    reviewed_at: null,
    reviewed_by: null,
    deleted_at: mentor.is_deleted ? mentor.updated_at : null,
    created_at: mentor.created_at,
    updated_at: mentor.updated_at,
  };
  const notes: readonly TAdjustment[] = [
    ...(mentor.id === null
      ? [
          adjustmentOf(
            LEGACY_TABLE.APP_MENTORS,
            id,
            ADJUSTMENT_RULE.MENTOR_ID_GENERATED,
            `user ${mentor.user_id}`
          ),
        ]
      : []),
    ...(status.known
      ? []
      : [
          adjustmentOf(
            LEGACY_TABLE.APP_MENTORS,
            id,
            ADJUSTMENT_RULE.MENTOR_STATUS_UNKNOWN,
            `${mentor.status} -> ${status.status}`
          ),
        ]),
  ];
  return outputOf({
    inserts: [{ table: TARGET_TABLE.MENTOR, rows: [row] }],
    files: cv.files,
    adjustments: A.concat(notes, cv.adjustments),
  });
};

export const mentorsTransform = (
  mentors: readonly TLegacyMentor[],
  legacyUsers: readonly TLegacyUser[],
  userIds: ReadonlySet<string>,
  options: TMigrationOptions
): TStepOutput => {
  const owners = new Map(
    A.map(legacyUsers, (user): [string, TLegacyUser] => [user.id, user])
  );
  return outputsMerge(
    A.map(
      mentors,
      (mentor): TStepOutput =>
        userIds.has(mentor.user_id)
          ? mentorOutput(mentor, owners.get(mentor.user_id), options)
          : outputOf({
              rejects: [
                rejectOf(
                  LEGACY_TABLE.APP_MENTORS,
                  mentorIdOf(mentor),
                  REJECT_REASON.USER_MISSING,
                  `user ${mentor.user_id}`
                ),
              ],
            })
    )
  );
};
