import { A, D } from '@mobily/ts-belt';
import type { THackathonSubmissionStatus } from '@app/schemas';
import { and, count, desc, eq, or, type SQL, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonParticipant,
  hackathonSubmission,
  hackathonTeam,
  hackathonTeamMember,
} from '#/platform/db/tables/hackathon.ts';
import { AdminRepo, type TAdminRepo } from '#/hackathon/domain/admin-repo.ts';
import {
  teamRefFields,
  teamSummaryFields,
} from '#/hackathon/infrastructure/hackathon-sql.ts';
import { participantFields } from '#/hackathon/infrastructure/participant-repository.ts';
import { teamSearchWhere } from '#/hackathon/infrastructure/team-filters.ts';

const participantSearchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.string.minLength(1), (value) =>
      or(containsWhere(user.name, value), containsWhere(user.email, value))
    )
    .otherwise(() => undefined);

const submissionSearchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.string.minLength(1), (value) =>
      or(
        containsWhere(hackathonSubmission.projectName, value),
        containsWhere(hackathonTeam.name, value)
      )
    )
    .otherwise(() => undefined);

const statusWhere = (
  status: THackathonSubmissionStatus | undefined
): SQL | undefined =>
  match(status)
    .with(P.string, (found) => eq(hackathonSubmission.status, found))
    .otherwise(() => undefined);

const submissionStatusOf = sql<THackathonSubmissionStatus | null>`(select ${hackathonSubmission.status} from ${hackathonSubmission} where ${hackathonSubmission.teamId} = ${hackathonTeam.id})`;

export const adminRepoLayer = Layer.effect(
  AdminRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const participants: TAdminRepo['participants'] = (input) => {
      const where = participantSearchWhere(input.search);
      return Effect.tryPromise({
        try: async () => {
          const [rows, [{ value: total }]] = await Promise.all([
            db
              .select({
                ...participantFields,
                role: user.role,
                createdAt: hackathonParticipant.createdAt,
                team: teamRefFields,
              })
              .from(hackathonParticipant)
              .innerJoin(user, eq(user.id, hackathonParticipant.userId))
              .leftJoin(
                hackathonTeamMember,
                eq(hackathonTeamMember.userId, hackathonParticipant.userId)
              )
              .leftJoin(
                hackathonTeam,
                eq(hackathonTeam.id, hackathonTeamMember.teamId)
              )
              .where(where)
              .orderBy(desc(hackathonParticipant.createdAt))
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db
              .select({ value: count() })
              .from(hackathonParticipant)
              .innerJoin(user, eq(user.id, hackathonParticipant.userId))
              .where(where),
          ]);
          const items = A.map(rows, (row) =>
            D.merge(row, { skills: row.skills ?? [] })
          );
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const teams: TAdminRepo['teams'] = (input) => {
      const where = teamSearchWhere(input.search);
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select({
                ...teamSummaryFields,
                submissionStatus: submissionStatusOf,
              })
              .from(hackathonTeam)
              .innerJoin(user, eq(user.id, hackathonTeam.leaderId))
              .where(where)
              .orderBy(desc(hackathonTeam.createdAt))
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db.select({ value: count() }).from(hackathonTeam).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const submissions: TAdminRepo['submissions'] = (input) => {
      const where = and(
        submissionSearchWhere(input.search),
        statusWhere(input.status)
      );
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select({ submission: hackathonSubmission, team: teamRefFields })
              .from(hackathonSubmission)
              .innerJoin(
                hackathonTeam,
                eq(hackathonTeam.id, hackathonSubmission.teamId)
              )
              .where(where)
              .orderBy(desc(hackathonSubmission.updatedAt))
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db
              .select({ value: count() })
              .from(hackathonSubmission)
              .innerJoin(
                hackathonTeam,
                eq(hackathonTeam.id, hackathonSubmission.teamId)
              )
              .where(where),
          ]);
          return {
            items: A.map(items, (row) =>
              D.merge(row.submission, { team: row.team })
            ),
            total,
          };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    return AdminRepo.of({ participants, teams, submissions });
  })
);
