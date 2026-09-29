import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type { TAdjustment } from '../../pipeline/step-types.ts';
import { stableUuid } from '../../shared/stable-uuid.ts';
import { adjustmentOf } from '../../shared/step-output.ts';
import type {
  THackathonMemberRow,
  THackathonTeamRow,
} from '../../target/target-hackathon-rows.ts';

const LEADER_NAMESPACE = 'hackathon-leader|';

export type TLeaderFix = {
  readonly rows: readonly THackathonMemberRow[];
  readonly adjustments: readonly TAdjustment[];
};

export const leaderFix = (
  team: THackathonTeamRow,
  kept: readonly THackathonMemberRow[]
): TLeaderFix => {
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.HACKATHON_TEAMS, team.id, rule, detail);
  const own = A.find(kept, (row): boolean => row.user_id === team.leader_id);
  return match(own)
    .with(
      { team_id: team.id },
      (): TLeaderFix => ({ rows: [], adjustments: [] })
    )
    .with(
      P.not(P.nullish),
      (other): TLeaderFix => ({
        rows: [],
        adjustments: [
          note(
            ADJUSTMENT_RULE.HACKATHON_LEADER_MISSING,
            `leader ${team.leader_id} belongs to team ${other.team_id}`
          ),
        ],
      })
    )
    .otherwise(
      (): TLeaderFix => ({
        rows: [
          {
            id: stableUuid(`${LEADER_NAMESPACE}${team.id}`),
            team_id: team.id,
            user_id: team.leader_id,
            role: HACKATHON_MEMBER_ROLE.LEADER,
            joined_at: team.created_at,
          },
        ],
        adjustments: [
          note(
            ADJUSTMENT_RULE.HACKATHON_LEADER_INSERTED,
            `leader ${team.leader_id}`
          ),
        ],
      })
    );
};
