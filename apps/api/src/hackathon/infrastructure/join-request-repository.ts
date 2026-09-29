import { HACKATHON_DECISION_STATUS } from '@app/schemas';
import { HACKATHON_MESSAGE } from '@app/messages';
import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonJoinRequest,
  hackathonTeam,
} from '#/platform/db/tables/hackathon.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepo,
} from '#/hackathon/domain/join-request-repo.ts';
import type { TJoinRequestRow } from '#/hackathon/domain/hackathon-rows.ts';
import {
  JOIN_OUTCOME,
  type TJoinOutcome,
} from '#/hackathon/domain/join-outcome.ts';
import {
  joinRequestPending,
  personFields,
  teamRefFields,
} from '#/hackathon/infrastructure/hackathon-sql.ts';
import {
  invitationsRejectFor,
  joinedGuard,
  joinOutcomeDiagnose,
  joinRequestsRejectFor,
  memberInsertGuarded,
  participantEnsure,
  rowCountOf,
  type TJoinTarget,
} from '#/hackathon/infrastructure/team-join.ts';

const requestsWhere = (
  db: TDb,
  where: SQL | undefined,
  order: SQL
): Promise<TJoinRequestRow[]> =>
  db
    .select({
      id: hackathonJoinRequest.id,
      team: teamRefFields,
      user: personFields,
      userEmail: user.email,
      message: hackathonJoinRequest.message,
      status: hackathonJoinRequest.status,
      createdAt: hackathonJoinRequest.createdAt,
      updatedAt: hackathonJoinRequest.updatedAt,
    })
    .from(hackathonJoinRequest)
    .innerJoin(hackathonTeam, eq(hackathonTeam.id, hackathonJoinRequest.teamId))
    .innerJoin(user, eq(user.id, hackathonJoinRequest.userId))
    .where(where)
    .orderBy(order);

const requestAccept = async (
  db: TDb,
  request: TJoinRequestRow
): Promise<TJoinOutcome> => {
  const target: TJoinTarget = {
    teamId: request.team.id,
    userId: request.user.id,
    email: request.userEmail,
    pending: joinRequestPending(request.id),
    at: new Date(),
  };
  const joined = joinedGuard(target);
  const [, inserted] = await db.batch([
    participantEnsure(db, target.userId),
    memberInsertGuarded(db, target),
    db
      .update(hackathonJoinRequest)
      .set({ status: HACKATHON_DECISION_STATUS.ACCEPTED, updatedAt: target.at })
      .where(
        and(
          eq(hackathonJoinRequest.id, request.id),
          eq(hackathonJoinRequest.status, HACKATHON_DECISION_STATUS.PENDING),
          joined
        )
      ),
    invitationsRejectFor(db, target.email, target.at, joined),
    joinRequestsRejectFor(db, target.userId, target.at, joined),
  ]);
  return rowCountOf(inserted) > 0
    ? JOIN_OUTCOME.JOINED
    : joinOutcomeDiagnose(db, target);
};

export const joinRequestRepoLayer = Layer.effect(
  JoinRequestRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const find: TJoinRequestRepo['find'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await requestsWhere(
            db,
            eq(hackathonJoinRequest.id, id),
            asc(hackathonJoinRequest.createdAt)
          );
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TJoinRequestRepo['create'] = (draft) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          await db.insert(hackathonJoinRequest).values({ ...draft, id });
          const [row] = await requestsWhere(
            db,
            eq(hackathonJoinRequest.id, id),
            asc(hackathonJoinRequest.createdAt)
          );
          return row as TJoinRequestRow;
        },
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({
                message: HACKATHON_MESSAGE.JOIN_REQUEST_DUPLICATE,
              })
            : new EDatabase({ cause }),
      });

    const listByUser: TJoinRequestRepo['listByUser'] = (userId) =>
      Effect.tryPromise({
        try: () =>
          requestsWhere(
            db,
            eq(hackathonJoinRequest.userId, userId),
            desc(hackathonJoinRequest.createdAt)
          ),
        catch: (cause) => new EDatabase({ cause }),
      });

    const listPendingByTeam: TJoinRequestRepo['listPendingByTeam'] = (teamId) =>
      Effect.tryPromise({
        try: () =>
          requestsWhere(
            db,
            and(
              eq(hackathonJoinRequest.teamId, teamId),
              eq(hackathonJoinRequest.status, HACKATHON_DECISION_STATUS.PENDING)
            ),
            asc(hackathonJoinRequest.createdAt)
          ),
        catch: (cause) => new EDatabase({ cause }),
      });

    const accept: TJoinRequestRepo['accept'] = (request) =>
      Effect.tryPromise({
        try: () => requestAccept(db, request),
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: HACKATHON_MESSAGE.USER_ALREADY_IN_TEAM })
            : new EDatabase({ cause }),
      });

    const reject: TJoinRequestRepo['reject'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .update(hackathonJoinRequest)
            .set({
              status: HACKATHON_DECISION_STATUS.REJECTED,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(hackathonJoinRequest.id, id),
                eq(
                  hackathonJoinRequest.status,
                  HACKATHON_DECISION_STATUS.PENDING
                )
              )
            )
            .returning({ id: hackathonJoinRequest.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return JoinRequestRepo.of({
      create,
      find,
      listByUser,
      listPendingByTeam,
      accept,
      reject,
    });
  })
);
