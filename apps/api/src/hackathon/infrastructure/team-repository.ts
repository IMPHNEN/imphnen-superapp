import { HACKATHON_MESSAGE } from '@app/messages';
import { D } from '@mobily/ts-belt';
import { and, asc, count, desc, eq, lte, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { hackathonTeam } from '#/platform/db/tables/hackathon.ts';
import { TeamRepo, type TTeamRepo } from '#/hackathon/domain/team-repo.ts';
import {
  memberCountOf,
  teamSummaryFields,
} from '#/hackathon/infrastructure/hackathon-sql.ts';
import { teamBrowseWhere } from '#/hackathon/infrastructure/team-filters.ts';
import {
  detailOf,
  teamCreate,
} from '#/hackathon/infrastructure/team-queries.ts';

export const teamRepoLayer = Layer.effect(
  TeamRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const browse: TTeamRepo['browse'] = (input) => {
      const where = teamBrowseWhere(input);
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select(teamSummaryFields)
              .from(hackathonTeam)
              .innerJoin(user, eq(user.id, hackathonTeam.leaderId))
              .where(where)
              .orderBy(desc(hackathonTeam.createdAt), asc(hackathonTeam.id))
              .limit(input.pageSize)
              .offset(offsetFor(input)),
            db.select({ value: count() }).from(hackathonTeam).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const find: TTeamRepo['find'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(hackathonTeam)
            .where(eq(hackathonTeam.id, id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findDetail: TTeamRepo['findDetail'] = (id) =>
      Effect.tryPromise({
        try: () => detailOf(db, id),
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TTeamRepo['create'] = (input, leader) =>
      Effect.tryPromise({
        try: () => teamCreate(db, input, leader.id, leader.email),
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: HACKATHON_MESSAGE.ALREADY_IN_TEAM })
            : new EDatabase({ cause }),
      });

    const update: TTeamRepo['update'] = ({ id, ...patch }) =>
      Effect.tryPromise({
        try: async () => {
          await db
            .update(hackathonTeam)
            .set(D.merge(patch, { updatedAt: new Date() }))
            .where(eq(hackathonTeam.id, id));
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const deleted = (
      where: SQL | undefined
    ): Effect.Effect<boolean, EDatabase> =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .delete(hackathonTeam)
            .where(where)
            .returning({ id: hackathonTeam.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const removeIfAlone: TTeamRepo['removeIfAlone'] = (id) =>
      deleted(
        and(eq(hackathonTeam.id, id), lte(memberCountOf(hackathonTeam.id), 1))
      );

    const remove: TTeamRepo['remove'] = (id) =>
      deleted(eq(hackathonTeam.id, id));

    return TeamRepo.of({
      browse,
      find,
      findDetail,
      create,
      update,
      removeIfAlone,
      remove,
    });
  })
);
