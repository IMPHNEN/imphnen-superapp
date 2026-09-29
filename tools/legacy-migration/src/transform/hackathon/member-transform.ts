import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TLegacyHackathonMember } from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { adjustmentOf, outputOf, rejectOf } from '../../shared/step-output.ts';
import type {
  THackathonMemberRow,
  THackathonTeamRow,
} from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { leaderFix, type TLeaderFix } from './leader-fix.ts';

const LEGACY_ACTIVE = 'active';

type TCandidate = {
  readonly row: THackathonMemberRow;
  readonly legacy: TLegacyHackathonMember;
};

const reject = (
  member: TLegacyHackathonMember,
  reason: TReject['reason'],
  detail: string
): TReject =>
  rejectOf(LEGACY_TABLE.HACKATHON_TEAM_MEMBERS, member.id, reason, detail);

const candidateOf = (
  member: TLegacyHackathonMember,
  team: THackathonTeamRow,
  userId: string
): TCandidate => ({
  legacy: member,
  row: {
    id: member.id,
    team_id: member.team_id,
    user_id: userId,
    role:
      member.role === HACKATHON_MEMBER_ROLE.LEADER || team.leader_id === userId
        ? HACKATHON_MEMBER_ROLE.LEADER
        : HACKATHON_MEMBER_ROLE.MEMBER,
    joined_at: member.joined_at ?? team.created_at,
  },
});

const preferred = (left: TCandidate, right: TCandidate): number =>
  Number(right.row.role === HACKATHON_MEMBER_ROLE.LEADER) -
    Number(left.row.role === HACKATHON_MEMBER_ROLE.LEADER) ||
  left.row.joined_at - right.row.joined_at ||
  left.row.id.localeCompare(right.row.id);

export const membersTransform = (
  members: readonly TLegacyHackathonMember[],
  teams: readonly THackathonTeamRow[],
  uidOf: (legacyId: string) => string | null
): TStepOutput => {
  const teamById = new Map(
    A.map(teams, (team): [string, THackathonTeamRow] => [team.id, team])
  );
  const checked = A.map(members, (member): TCandidate | TReject => {
    const team = teamById.get(member.team_id);
    const userId = uidOf(member.user_id);
    return match({ team, userId })
      .when(
        (): boolean => member.status !== LEGACY_ACTIVE,
        (): TReject =>
          reject(member, REJECT_REASON.MEMBER_INACTIVE, member.status)
      )
      .with(
        { team: P.nullish },
        (): TReject =>
          reject(member, REJECT_REASON.TEAM_MISSING, `team ${member.team_id}`)
      )
      .with(
        { userId: P.nullish },
        (): TReject =>
          reject(member, REJECT_REASON.USER_MISSING, `user ${member.user_id}`)
      )
      .otherwise(
        (found): TCandidate =>
          candidateOf(
            member,
            found.team as THackathonTeamRow,
            found.userId as string
          )
      );
  });
  const candidates = A.filter(
    checked,
    (item): boolean => 'row' in item
  ) as readonly TCandidate[];
  const early = A.filter(
    checked,
    (item): boolean => !('row' in item)
  ) as readonly TReject[];
  const byUser = D.values(
    A.groupBy(candidates, (item): string => item.row.user_id)
  ) as readonly (readonly TCandidate[])[];
  const ranked = A.map(byUser, (group): readonly TCandidate[] =>
    A.sort(group, preferred)
  );
  const kept = A.map(ranked, (group): THackathonMemberRow => group[0].row);
  const duplicates = A.flat(
    A.map(ranked, (group): readonly TReject[] =>
      A.map(
        A.drop(group, 1),
        (item): TReject =>
          reject(
            item.legacy,
            REJECT_REASON.MEMBER_DUPLICATE,
            `user ${item.row.user_id} kept in team ${group[0].row.team_id}`
          )
      )
    )
  );
  const fixes = A.map(teams, (team): TLeaderFix => leaderFix(team, kept));
  const roleNotes = A.filterMap(candidates, (item): TAdjustment | undefined =>
    item.row.role === item.legacy.role
      ? undefined
      : adjustmentOf(
          LEGACY_TABLE.HACKATHON_TEAM_MEMBERS,
          item.row.id,
          ADJUSTMENT_RULE.HACKATHON_VALUE_MAPPED,
          `role ${item.legacy.role} -> ${item.row.role}`
        )
  );
  return outputOf({
    inserts: [
      {
        table: TARGET_TABLE.HACKATHON_TEAM_MEMBER,
        rows: A.concat(
          kept,
          A.flat(
            A.map(fixes, (fix): readonly THackathonMemberRow[] => fix.rows)
          )
        ),
      },
    ],
    rejects: A.concat(early, duplicates),
    adjustments: A.concat(
      roleNotes,
      A.flat(A.map(fixes, (fix): readonly TAdjustment[] => fix.adjustments))
    ),
  });
};
