import { HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EDatabase } from '#/shared/errors.ts';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonSubmission,
  hackathonTeam,
  hackathonTeamMember,
  hackathonWinner,
} from '#/platform/db/tables/hackathon.ts';
import {
  CertificateRepo,
  type TCertificateRepo,
  type TWinnerRepo,
  WinnerRepo,
} from '#/hackathon/domain/award-repo.ts';
import type {
  TCertificateRow,
  TWinnerRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import { teamRefFields } from '#/hackathon/infrastructure/hackathon-sql.ts';

const winnersWhere = (db: TDb, where: SQL | undefined): Promise<TWinnerRow[]> =>
  db
    .select({
      id: hackathonWinner.id,
      rank: hackathonWinner.rank,
      prize: hackathonWinner.prize,
      announcedAt: hackathonWinner.announcedAt,
      createdAt: hackathonWinner.createdAt,
      updatedAt: hackathonWinner.updatedAt,
      team: { ...teamRefFields, city: hackathonTeam.city },
      projectName: hackathonSubmission.projectName,
    })
    .from(hackathonWinner)
    .innerJoin(hackathonTeam, eq(hackathonTeam.id, hackathonWinner.teamId))
    .leftJoin(
      hackathonSubmission,
      eq(hackathonSubmission.teamId, hackathonWinner.teamId)
    )
    .where(where)
    .orderBy(asc(hackathonWinner.rank), asc(hackathonTeam.name));

const certificatesWhere = (
  db: TDb,
  where: SQL | undefined
): Promise<TCertificateRow[]> =>
  db
    .select({
      id: hackathonTeamMember.id,
      userId: user.id,
      userName: user.name,
      team: teamRefFields,
      role: hackathonTeamMember.role,
      projectName: hackathonSubmission.projectName,
      submittedAt: hackathonSubmission.submittedAt,
      rank: hackathonWinner.rank,
      prize: hackathonWinner.prize,
    })
    .from(hackathonTeamMember)
    .innerJoin(user, eq(user.id, hackathonTeamMember.userId))
    .innerJoin(hackathonTeam, eq(hackathonTeam.id, hackathonTeamMember.teamId))
    .innerJoin(
      hackathonSubmission,
      and(
        eq(hackathonSubmission.teamId, hackathonTeamMember.teamId),
        eq(hackathonSubmission.status, HACKATHON_SUBMISSION_STATUS.SUBMITTED)
      )
    )
    .leftJoin(
      hackathonWinner,
      eq(hackathonWinner.teamId, hackathonTeamMember.teamId)
    )
    .where(where)
    .limit(1);

export const winnerRepoLayer = Layer.effect(
  WinnerRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TWinnerRepo['list'] = () =>
      Effect.tryPromise({
        try: () => winnersWhere(db, undefined),
        catch: (cause) => new EDatabase({ cause }),
      });

    const upsert: TWinnerRepo['upsert'] = (input) =>
      Effect.tryPromise({
        try: async () => {
          const at = new Date();
          const prize = input.prize ?? null;
          await db
            .insert(hackathonWinner)
            .values({
              teamId: input.teamId,
              rank: input.rank,
              prize,
              announcedAt: at,
            })
            .onConflictDoUpdate({
              target: hackathonWinner.teamId,
              set: { rank: input.rank, prize, updatedAt: at },
            });
          const [row] = await winnersWhere(
            db,
            eq(hackathonWinner.teamId, input.teamId)
          );
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TWinnerRepo['remove'] = (teamId) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .delete(hackathonWinner)
            .where(eq(hackathonWinner.teamId, teamId))
            .returning({ id: hackathonWinner.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return WinnerRepo.of({ list, upsert, remove });
  })
);

export const certificateRepoLayer = Layer.effect(
  CertificateRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const findWhere = (
      where: SQL
    ): Effect.Effect<TCertificateRow | null, EDatabase> =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await certificatesWhere(db, where);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const find: TCertificateRepo['find'] = (id) =>
      findWhere(eq(hackathonTeamMember.id, id));

    const findByUser: TCertificateRepo['findByUser'] = (userId) =>
      findWhere(eq(hackathonTeamMember.userId, userId));

    return CertificateRepo.of({ find, findByUser });
  })
);
