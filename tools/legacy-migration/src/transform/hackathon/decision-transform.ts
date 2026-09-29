import { HACKATHON_DECISION_STATUS } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type {
  TLegacyHackathonInvitation,
  TLegacyHackathonJoinRequest,
} from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE, type TLegacyTable } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { adjustmentOf, outputOf, rejectOf } from '../../shared/step-output.ts';
import type {
  THackathonInvitationRow,
  THackathonJoinRequestRow,
} from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE, type TTargetTable } from '../../target/target-table.ts';
import { normaliseEmail } from '../iam/user-transform.ts';

type TDecisionRow = THackathonInvitationRow | THackathonJoinRequestRow;

const STATUSES: readonly string[] = D.values(HACKATHON_DECISION_STATUS);

const statusOf = (status: string): string =>
  A.includes(STATUSES, status) ? status : HACKATHON_DECISION_STATUS.REJECTED;

const newestFirst = (left: TDecisionRow, right: TDecisionRow): number =>
  right.created_at - left.created_at || left.id.localeCompare(right.id);

const pendingDedupe = <TRow extends TDecisionRow>(
  rows: readonly TRow[],
  pairOf: (row: TRow) => string,
  table: TLegacyTable
): {
  readonly rows: readonly TRow[];
  readonly adjustments: readonly TAdjustment[];
} => {
  const pending = A.filter(
    rows,
    (row): boolean => row.status === HACKATHON_DECISION_STATUS.PENDING
  );
  const groups = D.values(
    A.groupBy(pending, pairOf)
  ) as readonly (readonly TRow[])[];
  const demoted = new Set(
    A.flat(
      A.map(groups, (group): readonly string[] =>
        A.map(A.drop(A.sort(group, newestFirst), 1), (row): string => row.id)
      )
    )
  );
  return {
    rows: A.map(
      rows,
      (row): TRow =>
        demoted.has(row.id)
          ? { ...row, status: HACKATHON_DECISION_STATUS.REJECTED }
          : row
    ),
    adjustments: A.map(
      [...demoted],
      (id): TAdjustment =>
        adjustmentOf(
          table,
          id,
          ADJUSTMENT_RULE.HACKATHON_PENDING_REJECTED,
          'older duplicate pending row'
        )
    ),
  };
};

const decisionOutput = <TRow extends TDecisionRow>(
  checked: readonly (TRow | TReject)[],
  legacyStatus: ReadonlyMap<string, string>,
  pairOf: (row: TRow) => string,
  table: TLegacyTable,
  target: TTargetTable
): TStepOutput => {
  const rows = A.filter(
    checked,
    (item): boolean => !('reason' in item)
  ) as readonly TRow[];
  const deduped = pendingDedupe(rows, pairOf, table);
  const unknown = A.filterMap(rows, (row): TAdjustment | undefined =>
    legacyStatus.get(row.id) === row.status
      ? undefined
      : adjustmentOf(
          table,
          row.id,
          ADJUSTMENT_RULE.HACKATHON_VALUE_MAPPED,
          `status ${legacyStatus.get(row.id)} -> ${row.status}`
        )
  );
  return outputOf({
    inserts: [{ table: target, rows: deduped.rows }],
    rejects: A.filter(
      checked,
      (item): boolean => 'reason' in item
    ) as readonly TReject[],
    adjustments: A.concat(unknown, deduped.adjustments),
  });
};

const checkParents = <TRow>(
  table: TLegacyTable,
  id: string,
  teamId: string,
  teamIds: ReadonlySet<string>,
  userId: string | null,
  legacyUser: string,
  build: (userId: string) => TRow
): TRow | TReject =>
  match({ team: teamIds.has(teamId), userId })
    .with(
      { team: false },
      (): TReject =>
        rejectOf(table, id, REJECT_REASON.TEAM_MISSING, `team ${teamId}`)
    )
    .with({ userId: P.string }, (found): TRow => build(found.userId))
    .otherwise(
      (): TReject =>
        rejectOf(table, id, REJECT_REASON.USER_MISSING, `user ${legacyUser}`)
    );

export const invitationsTransform = (
  invitations: readonly TLegacyHackathonInvitation[],
  teamIds: ReadonlySet<string>,
  uidOf: (legacyId: string) => string | null,
  now: number
): TStepOutput =>
  decisionOutput(
    A.map(invitations, (row): THackathonInvitationRow | TReject =>
      checkParents(
        LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS,
        row.id,
        row.team_id,
        teamIds,
        uidOf(row.inviter_id),
        row.inviter_id,
        (inviterId): THackathonInvitationRow => ({
          id: row.id,
          team_id: row.team_id,
          inviter_id: inviterId,
          invitee_email: normaliseEmail(row.invitee_email),
          status: statusOf(row.status),
          created_at: row.created_at ?? now,
          updated_at: row.created_at ?? now,
        })
      )
    ),
    new Map(
      A.map(invitations, (row): [string, string] => [row.id, row.status])
    ),
    (row): string => `${row.team_id}|${row.invitee_email}`,
    LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS,
    TARGET_TABLE.HACKATHON_INVITATION
  );

export const joinRequestsTransform = (
  requests: readonly TLegacyHackathonJoinRequest[],
  teamIds: ReadonlySet<string>,
  uidOf: (legacyId: string) => string | null,
  now: number
): TStepOutput =>
  decisionOutput(
    A.map(requests, (row): THackathonJoinRequestRow | TReject =>
      checkParents(
        LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS,
        row.id,
        row.team_id,
        teamIds,
        uidOf(row.user_id),
        row.user_id,
        (userId): THackathonJoinRequestRow => ({
          id: row.id,
          team_id: row.team_id,
          user_id: userId,
          message: row.message ?? '',
          status: statusOf(row.status),
          created_at: row.created_at ?? now,
          updated_at: row.created_at ?? now,
        })
      )
    ),
    new Map(A.map(requests, (row): [string, string] => [row.id, row.status])),
    (row): string => `${row.team_id}|${row.user_id}`,
    LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS,
    TARGET_TABLE.HACKATHON_JOIN_REQUEST
  );
