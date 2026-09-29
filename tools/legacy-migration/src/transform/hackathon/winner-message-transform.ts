import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type {
  TLegacyHackathonMessage,
  TLegacyHackathonWinner,
} from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { REJECT_REASON } from '../../pipeline/report-codes.ts';
import type { TReject, TStepOutput } from '../../pipeline/step-types.ts';
import { outputOf, rejectOf } from '../../shared/step-output.ts';
import type {
  THackathonMessageRow,
  THackathonWinnerRow,
} from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

export const winnersTransform = (
  winners: readonly TLegacyHackathonWinner[],
  teamIds: ReadonlySet<string>,
  now: number
): TStepOutput => {
  const [known, orphan] = A.partition(winners, (row): boolean =>
    teamIds.has(row.team_id)
  );
  return outputOf({
    inserts: [
      {
        table: TARGET_TABLE.HACKATHON_WINNER,
        rows: A.map(known, (row): THackathonWinnerRow => {
          const createdAt = row.created_at ?? now;
          return {
            id: row.id,
            team_id: row.team_id,
            rank: row.rank,
            prize: row.prize,
            announced_at: row.announced_at ?? createdAt,
            created_at: createdAt,
            updated_at: row.updated_at ?? createdAt,
          };
        }),
      },
    ],
    rejects: A.map(
      orphan,
      (row): TReject =>
        rejectOf(
          LEGACY_TABLE.HACKATHON_WINNERS,
          row.id,
          REJECT_REASON.TEAM_MISSING,
          `team ${row.team_id}`
        )
    ),
  });
};

export const messagesTransform = (
  messages: readonly TLegacyHackathonMessage[],
  teamIds: ReadonlySet<string>,
  uidOf: (legacyId: string) => string | null,
  now: number
): TStepOutput => {
  const checked = A.map(messages, (row): THackathonMessageRow | TReject => {
    const userId = uidOf(row.user_id);
    return match({ team: teamIds.has(row.team_id), userId })
      .with(
        { team: false },
        (): TReject =>
          rejectOf(
            LEGACY_TABLE.HACKATHON_TEAM_MESSAGES,
            row.id,
            REJECT_REASON.TEAM_MISSING,
            `team ${row.team_id}`
          )
      )
      .with(
        { userId: P.string },
        (found): THackathonMessageRow => ({
          id: row.id,
          team_id: row.team_id,
          user_id: found.userId,
          body: row.message,
          created_at: row.created_at ?? now,
        })
      )
      .otherwise(
        (): TReject =>
          rejectOf(
            LEGACY_TABLE.HACKATHON_TEAM_MESSAGES,
            row.id,
            REJECT_REASON.USER_MISSING,
            `user ${row.user_id}`
          )
      );
  });
  return outputOf({
    inserts: [
      {
        table: TARGET_TABLE.HACKATHON_MESSAGE,
        rows: A.filter(
          checked,
          (item): boolean => !('reason' in item)
        ) as readonly THackathonMessageRow[],
      },
    ],
    rejects: A.filter(
      checked,
      (item): boolean => 'reason' in item
    ) as readonly TReject[],
  });
};
