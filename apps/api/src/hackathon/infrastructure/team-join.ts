import {
  HACKATHON_DECISION_STATUS,
  HACKATHON_LIMIT,
  HACKATHON_MEMBER_ROLE,
} from '@app/schemas';
import { and, eq, type SQL, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { match, P } from 'ts-pattern';
import type { TDb } from '#/platform/db/client.ts';
import {
  hackathonInvitation,
  hackathonJoinRequest,
  hackathonParticipant,
  hackathonTeam,
  hackathonTeamMember,
} from '#/platform/db/tables/hackathon.ts';
import {
  memberCountOf,
  membershipExists,
  submissionExistsFor,
} from '#/hackathon/infrastructure/hackathon-sql.ts';
import {
  JOIN_OUTCOME,
  type TJoinOutcome,
} from '#/hackathon/domain/join-outcome.ts';

export type TBatchItem = BatchItem<'sqlite'>;

export const rowCountOf = (result: unknown): number =>
  match(result)
    .with(P.array(), (rows): number => rows.length)
    .otherwise((): number => 0);

export type TJoinTarget = {
  teamId: string;
  userId: string;
  email: string;
  pending: SQL;
  at: Date;
};

export const participantEnsure = (db: TDb, userId: string): TBatchItem =>
  db.insert(hackathonParticipant).values({ userId }).onConflictDoNothing();

export const memberInsertGuarded = (db: TDb, target: TJoinTarget): TBatchItem =>
  db
    .insert(hackathonTeamMember)
    .select(
      sql`select ${crypto.randomUUID()}, ${target.teamId}, ${target.userId}, ${HACKATHON_MEMBER_ROLE.MEMBER}, ${target.at.getTime()} where ${memberCountOf(target.teamId)} < ${HACKATHON_LIMIT.TEAM_MAX_MEMBERS} and not ${submissionExistsFor(target.teamId)} and ${target.pending}`
    )
    .returning({ id: hackathonTeamMember.id });

export const invitationsRejectFor = (
  db: TDb,
  email: string,
  at: Date,
  guard: SQL | undefined
): TBatchItem =>
  db
    .update(hackathonInvitation)
    .set({ status: HACKATHON_DECISION_STATUS.REJECTED, updatedAt: at })
    .where(
      and(
        eq(hackathonInvitation.inviteeEmail, email),
        eq(hackathonInvitation.status, HACKATHON_DECISION_STATUS.PENDING),
        guard
      )
    );

export const joinRequestsRejectFor = (
  db: TDb,
  userId: string,
  at: Date,
  guard: SQL | undefined
): TBatchItem =>
  db
    .update(hackathonJoinRequest)
    .set({ status: HACKATHON_DECISION_STATUS.REJECTED, updatedAt: at })
    .where(
      and(
        eq(hackathonJoinRequest.userId, userId),
        eq(hackathonJoinRequest.status, HACKATHON_DECISION_STATUS.PENDING),
        guard
      )
    );

export const joinedGuard = (target: TJoinTarget): SQL =>
  membershipExists(target.teamId, target.userId);

type TJoinState = {
  teamExists: boolean;
  memberCount: number;
  locked: boolean;
  pending: boolean;
};

export const joinOutcomeDiagnose = async (
  db: TDb,
  target: TJoinTarget
): Promise<TJoinOutcome> => {
  const [state] = await db
    .select({
      teamExists:
        sql<boolean>`exists (select 1 from ${hackathonTeam} where ${hackathonTeam.id} = ${target.teamId})`.mapWith(
          Boolean
        ),
      memberCount: memberCountOf(target.teamId),
      locked: submissionExistsFor(target.teamId),
      pending: sql<boolean>`${target.pending}`.mapWith(Boolean),
    })
    .from(sql`(select 1)`);

  return match<TJoinState | undefined, TJoinOutcome>(state)
    .with(P.nullish, () => JOIN_OUTCOME.TEAM_GONE)
    .with({ teamExists: false }, () => JOIN_OUTCOME.TEAM_GONE)
    .with({ pending: false }, () => JOIN_OUTCOME.NOT_PENDING)
    .with({ locked: true }, () => JOIN_OUTCOME.TEAM_LOCKED)
    .with(
      { memberCount: P.number.gte(HACKATHON_LIMIT.TEAM_MAX_MEMBERS) },
      () => JOIN_OUTCOME.TEAM_FULL
    )
    .otherwise(() => JOIN_OUTCOME.NOT_PENDING);
};
