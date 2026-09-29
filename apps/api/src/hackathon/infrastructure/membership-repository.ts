import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { and, eq, not, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EDatabase } from '#/shared/errors.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonTeam,
  hackathonTeamMember,
} from '#/platform/db/tables/hackathon.ts';
import {
  MembershipRepo,
  type TMembershipRepo,
} from '#/hackathon/domain/membership-repo.ts';
import {
  memberCountOf,
  submissionExistsFor,
} from '#/hackathon/infrastructure/hackathon-sql.ts';

const membershipFields = {
  teamId: hackathonTeamMember.teamId,
  userId: hackathonTeamMember.userId,
  role: hackathonTeamMember.role,
};

export const membershipRepoLayer = Layer.effect(
  MembershipRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const findByUser: TMembershipRepo['findByUser'] = (userId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(membershipFields)
            .from(hackathonTeamMember)
            .where(eq(hackathonTeamMember.userId, userId))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findByEmail: TMembershipRepo['findByEmail'] = (email) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(membershipFields)
            .from(hackathonTeamMember)
            .innerJoin(user, eq(user.id, hackathonTeamMember.userId))
            .where(eq(user.email, email))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const teamState: TMembershipRepo['teamState'] = (teamId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select({
              memberCount: memberCountOf(hackathonTeam.id),
              hasSubmission: submissionExistsFor(hackathonTeam.id),
            })
            .from(hackathonTeam)
            .where(eq(hackathonTeam.id, teamId))
            .limit(1);
          return row === undefined
            ? { exists: false, memberCount: 0, hasSubmission: false }
            : { exists: true, ...row };
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const removeMember: TMembershipRepo['removeMember'] = (teamId, userId) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .delete(hackathonTeamMember)
            .where(
              and(
                eq(hackathonTeamMember.teamId, teamId),
                eq(hackathonTeamMember.userId, userId),
                eq(hackathonTeamMember.role, HACKATHON_MEMBER_ROLE.MEMBER),
                not(sql`${submissionExistsFor(teamId)}`)
              )
            )
            .returning({ id: hackathonTeamMember.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return MembershipRepo.of({
      findByUser,
      findByEmail,
      teamState,
      removeMember,
    });
  })
);
