import {
  HACKATHON_MEMBER_ROLE,
  type THackathonTeamCreateInput,
} from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { asc, eq, sql } from 'drizzle-orm';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonParticipant,
  hackathonTeam,
  hackathonTeamMember,
} from '#/platform/db/tables/hackathon.ts';
import type {
  TTeamDetailRow,
  TTeamMemberRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import {
  personFields,
  teamSummaryFields,
} from '#/hackathon/infrastructure/hackathon-sql.ts';
import {
  invitationsRejectFor,
  joinRequestsRejectFor,
  participantEnsure,
} from '#/hackathon/infrastructure/team-join.ts';

const LEADER_FIRST = sql`case when ${hackathonTeamMember.role} = ${HACKATHON_MEMBER_ROLE.LEADER} then 0 else 1 end`;

const membersOf = (db: TDb, teamId: string): Promise<TTeamMemberRow[]> =>
  db
    .select({
      user: personFields,
      role: hackathonTeamMember.role,
      joinedAt: hackathonTeamMember.joinedAt,
      email: user.email,
      phoneNumber: hackathonParticipant.phoneNumber,
    })
    .from(hackathonTeamMember)
    .innerJoin(user, eq(user.id, hackathonTeamMember.userId))
    .leftJoin(
      hackathonParticipant,
      eq(hackathonParticipant.userId, hackathonTeamMember.userId)
    )
    .where(eq(hackathonTeamMember.teamId, teamId))
    .orderBy(LEADER_FIRST, asc(hackathonTeamMember.joinedAt));

export const detailOf = async (
  db: TDb,
  id: string
): Promise<TTeamDetailRow | null> => {
  const [[team], members] = await Promise.all([
    db
      .select(teamSummaryFields)
      .from(hackathonTeam)
      .innerJoin(user, eq(user.id, hackathonTeam.leaderId))
      .where(eq(hackathonTeam.id, id))
      .limit(1),
    membersOf(db, id),
  ]);
  return team === undefined ? null : D.merge(team, { members });
};

export const teamCreate = async (
  db: TDb,
  input: THackathonTeamCreateInput,
  leaderId: string,
  leaderEmail: string
): Promise<string> => {
  const id = crypto.randomUUID();
  const at = new Date();
  await db.batch([
    db.insert(hackathonTeam).values({
      id,
      name: input.name,
      description: input.description ?? null,
      city: input.city,
      visibility: input.visibility,
      logoKey: input.logoKey ?? null,
      bannerKey: input.bannerKey ?? null,
      leaderId,
    }),
    participantEnsure(db, leaderId),
    db.insert(hackathonTeamMember).values({
      teamId: id,
      userId: leaderId,
      role: HACKATHON_MEMBER_ROLE.LEADER,
      joinedAt: at,
    }),
    invitationsRejectFor(db, leaderEmail, at, undefined),
    joinRequestsRejectFor(db, leaderId, at, undefined),
  ]);
  return id;
};
