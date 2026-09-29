import { A, D } from '@mobily/ts-belt';
import type { TLegacyHackathonSubmission } from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TFileCopy,
  TFileRef,
  TMigrationOptions,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { jsonText } from '../../shared/json-text.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { THackathonSubmissionRow } from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { arrayRef, valueRef } from '../shared/legacy-file.ts';
import {
  HACKATHON_FILE_PREFIX,
  hackathonKeyFile,
  hackathonUrlFile,
  type THackathonFile,
} from './hackathon-file.ts';
import {
  SUBMISSION_COLUMN,
  screenshotsOf,
  submissionPreferred,
  submissionStatusOf,
} from './submission-rules.ts';

type TShot = { readonly value: string; readonly file: THackathonFile };

const submissionOutput = (
  row: TLegacyHackathonSubmission,
  createdBy: string | null,
  options: TMigrationOptions
): TStepOutput => {
  const presentation = hackathonUrlFile(
    row.presentation_url,
    HACKATHON_FILE_PREFIX.SUBMISSION,
    (stored): TFileRef =>
      valueRef(
        TARGET_TABLE.HACKATHON_SUBMISSION,
        row.id,
        SUBMISSION_COLUMN.PRESENTATION,
        stored,
        null
      ),
    options
  );
  const shots = A.map(
    screenshotsOf(row.screenshots),
    (value): TShot => ({
      value,
      file: hackathonKeyFile(
        value,
        HACKATHON_FILE_PREFIX.SUBMISSION,
        (stored): TFileRef =>
          arrayRef(
            TARGET_TABLE.HACKATHON_SUBMISSION,
            row.id,
            SUBMISSION_COLUMN.SCREENSHOTS,
            stored
          ),
        options
      ),
    })
  );
  const status = submissionStatusOf(row.status);
  const createdAt = row.created_at ?? options.now;
  const target: THackathonSubmissionRow = {
    id: row.id,
    team_id: row.team_id,
    project_name: row.project_name,
    description: row.description,
    repository_url: row.repository_url,
    demo_url: row.demo_url,
    presentation_url: presentation.stored,
    video_url: null,
    screenshot_keys: jsonText(
      A.filterMap(
        shots,
        (shot): string | undefined => shot.file.stored ?? undefined
      )
    ),
    status,
    submitted_at: row.submitted_at,
    created_by: createdBy,
    created_at: createdAt,
    updated_at: row.updated_at ?? createdAt,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(
      LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS,
      row.id,
      rule,
      detail
    );
  return outputOf({
    inserts: [{ table: TARGET_TABLE.HACKATHON_SUBMISSION, rows: [target] }],
    files: A.filterMap(
      A.append(
        A.map(shots, (shot): TFileCopy | null => shot.file.file),
        presentation.file
      ),
      (file): TFileCopy | undefined => file ?? undefined
    ),
    adjustments: [
      ...(status === row.status
        ? []
        : [
            note(
              ADJUSTMENT_RULE.HACKATHON_VALUE_MAPPED,
              `status ${row.status} -> ${status}`
            ),
          ]),
      ...(createdBy === null
        ? [
            note(
              ADJUSTMENT_RULE.HACKATHON_CREATOR_CLEARED,
              `submitted_by ${row.submitted_by}`
            ),
          ]
        : []),
      ...A.filterMap(shots, (shot): TAdjustment | undefined =>
        shot.file.stored === null
          ? note(
              ADJUSTMENT_RULE.HACKATHON_VALUE_MAPPED,
              `screenshot ${shot.value} dropped`
            )
          : undefined
      ),
    ],
  });
};

export const submissionsTransform = (
  submissions: readonly TLegacyHackathonSubmission[],
  teamIds: ReadonlySet<string>,
  uidOf: (legacyId: string) => string | null,
  options: TMigrationOptions
): TStepOutput => {
  const [known, orphan] = A.partition(submissions, (row): boolean =>
    teamIds.has(row.team_id)
  );
  const ranked = A.map(
    D.values(
      A.groupBy(known, (row): string => row.team_id)
    ) as readonly (readonly TLegacyHackathonSubmission[])[],
    (group): readonly TLegacyHackathonSubmission[] =>
      A.sort(group, submissionPreferred)
  );
  return outputsMerge([
    ...A.map(
      ranked,
      (group): TStepOutput =>
        submissionOutput(group[0], uidOf(group[0].submitted_by), options)
    ),
    outputOf({
      rejects: A.concat(
        A.map(
          orphan,
          (row): TReject =>
            rejectOf(
              LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS,
              row.id,
              REJECT_REASON.TEAM_MISSING,
              `team ${row.team_id}`
            )
        ),
        A.flat(
          A.map(ranked, (group): readonly TReject[] =>
            A.map(
              A.drop(group, 1),
              (row): TReject =>
                rejectOf(
                  LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS,
                  row.id,
                  REJECT_REASON.SUBMISSION_DUPLICATE,
                  `team ${row.team_id} keeps ${group[0].id}`
                )
            )
          )
        )
      ),
    }),
  ]);
};
