import { HACKATHON_TEAM_VISIBILITY } from '@app/schemas';
import { count, eq } from 'drizzle-orm';
import { Effect } from 'effect';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import { hackathonTeamMember } from '#/platform/db/tables/hackathon.ts';
import type { TInvitationRow } from '#/hackathon/domain/hackathon-rows.ts';
import {
  InvitationRepo,
  type TInvitationRepoId,
} from '#/hackathon/domain/invitation-repo.ts';
import type { TJoinOutcome } from '#/hackathon/domain/join-outcome.ts';
import { TeamRepo } from '#/hackathon/domain/team-repo.ts';
import {
  emailOf,
  type TSeededDb,
} from '#/hackathon/infrastructure/testing/seed.ts';

export const CITY = 'Medan';

export const teamOf = (seeded: TSeededDb, leaderId: string): Promise<string> =>
  seeded.run(
    TeamRepo.use((repo) =>
      repo.create(
        {
          name: leaderId,
          city: CITY,
          visibility: HACKATHON_TEAM_VISIBILITY.PUBLIC,
        },
        { id: leaderId, email: emailOf(leaderId) }
      )
    )
  );

export const invite = (
  teamId: string,
  inviterId: string,
  userId: string
): Effect.Effect<TInvitationRow, EDatabase | EConflict, TInvitationRepoId> =>
  InvitationRepo.use((repo) =>
    repo.create({ teamId, inviterId, inviteeEmail: emailOf(userId) })
  );

export const inviteAndAccept = (
  seeded: TSeededDb,
  teamId: string,
  inviterId: string,
  userId: string
): Promise<TJoinOutcome> =>
  seeded.run(
    invite(teamId, inviterId, userId).pipe(
      Effect.flatMap((invitation) =>
        InvitationRepo.use((repo) => repo.accept(invitation, userId))
      )
    )
  );

export const memberCount = async (
  seeded: TSeededDb,
  teamId: string
): Promise<number> => {
  const [row] = await seeded.db
    .select({ value: count() })
    .from(hackathonTeamMember)
    .where(eq(hackathonTeamMember.teamId, teamId));
  return row?.value ?? 0;
};
