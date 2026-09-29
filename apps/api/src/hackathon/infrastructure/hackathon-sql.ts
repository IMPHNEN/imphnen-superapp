import { HACKATHON_DECISION_STATUS } from '@app/schemas';
import { getTableColumns, type SQL, type SQLWrapper, sql } from 'drizzle-orm';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonInvitation,
  hackathonJoinRequest,
  hackathonSubmission,
  hackathonTeam,
  hackathonTeamMember,
} from '#/platform/db/tables/hackathon.ts';

type TTeamIdRef = SQLWrapper | string;

export const memberCountOf = (teamId: TTeamIdRef): SQL<number> =>
  sql<number>`(select count(*) from ${hackathonTeamMember} where ${hackathonTeamMember.teamId} = ${teamId})`.mapWith(
    Number
  );

export const submissionExistsFor = (teamId: TTeamIdRef): SQL<boolean> =>
  sql<boolean>`exists (select 1 from ${hackathonSubmission} where ${hackathonSubmission.teamId} = ${teamId})`.mapWith(
    Boolean
  );

export const membershipExists = (teamId: string, userId: string): SQL =>
  sql`exists (select 1 from ${hackathonTeamMember} where ${hackathonTeamMember.teamId} = ${teamId} and ${hackathonTeamMember.userId} = ${userId})`;

export const invitationPending = (id: string): SQL =>
  sql`exists (select 1 from ${hackathonInvitation} where ${hackathonInvitation.id} = ${id} and ${hackathonInvitation.status} = ${HACKATHON_DECISION_STATUS.PENDING})`;

export const joinRequestPending = (id: string): SQL =>
  sql`exists (select 1 from ${hackathonJoinRequest} where ${hackathonJoinRequest.id} = ${id} and ${hackathonJoinRequest.status} = ${HACKATHON_DECISION_STATUS.PENDING})`;

export const personFields = {
  id: user.id,
  name: user.name,
  image: user.image,
};

export const teamRefFields = {
  id: hackathonTeam.id,
  name: hackathonTeam.name,
  logoKey: hackathonTeam.logoKey,
};

export const teamSummaryFields = {
  ...getTableColumns(hackathonTeam),
  leader: personFields,
  memberCount: memberCountOf(hackathonTeam.id),
  hasSubmission: submissionExistsFor(hackathonTeam.id),
};
