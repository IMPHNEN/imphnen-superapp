import { HACKATHON_DECISION_STATUS } from '@app/schemas';
import { HACKATHON_MESSAGE } from '@app/messages';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { user } from '#/platform/db/tables/auth.ts';
import {
  hackathonInvitation,
  hackathonTeam,
} from '#/platform/db/tables/hackathon.ts';
import {
  InvitationRepo,
  type TInvitationRepo,
} from '#/hackathon/domain/invitation-repo.ts';
import type { TInvitationRow } from '#/hackathon/domain/hackathon-rows.ts';
import {
  JOIN_OUTCOME,
  type TJoinOutcome,
} from '#/hackathon/domain/join-outcome.ts';
import {
  invitationPending,
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

const invitationsWhere = (
  db: TDb,
  where: SQL | undefined
): Promise<TInvitationRow[]> =>
  db
    .select({
      id: hackathonInvitation.id,
      team: teamRefFields,
      inviter: personFields,
      inviteeEmail: hackathonInvitation.inviteeEmail,
      status: hackathonInvitation.status,
      createdAt: hackathonInvitation.createdAt,
      updatedAt: hackathonInvitation.updatedAt,
    })
    .from(hackathonInvitation)
    .innerJoin(hackathonTeam, eq(hackathonTeam.id, hackathonInvitation.teamId))
    .innerJoin(user, eq(user.id, hackathonInvitation.inviterId))
    .where(where)
    .orderBy(asc(hackathonInvitation.createdAt));

const invitationAccept = async (
  db: TDb,
  invitation: TInvitationRow,
  userId: string
): Promise<TJoinOutcome> => {
  const target: TJoinTarget = {
    teamId: invitation.team.id,
    userId,
    email: invitation.inviteeEmail,
    pending: invitationPending(invitation.id),
    at: new Date(),
  };
  const joined = joinedGuard(target);
  const [, inserted] = await db.batch([
    participantEnsure(db, userId),
    memberInsertGuarded(db, target),
    db
      .update(hackathonInvitation)
      .set({ status: HACKATHON_DECISION_STATUS.ACCEPTED, updatedAt: target.at })
      .where(
        and(
          eq(hackathonInvitation.id, invitation.id),
          eq(hackathonInvitation.status, HACKATHON_DECISION_STATUS.PENDING),
          joined
        )
      ),
    invitationsRejectFor(db, target.email, target.at, joined),
    joinRequestsRejectFor(db, userId, target.at, joined),
  ]);
  return rowCountOf(inserted) > 0
    ? JOIN_OUTCOME.JOINED
    : joinOutcomeDiagnose(db, target);
};

export const invitationRepoLayer = Layer.effect(
  InvitationRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const find: TInvitationRepo['find'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await invitationsWhere(
            db,
            eq(hackathonInvitation.id, id)
          );
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TInvitationRepo['create'] = (draft) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          await db.insert(hackathonInvitation).values({ ...draft, id });
          const [row] = await invitationsWhere(
            db,
            eq(hackathonInvitation.id, id)
          );
          return row as TInvitationRow;
        },
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: HACKATHON_MESSAGE.INVITATION_DUPLICATE })
            : new EDatabase({ cause }),
      });

    const listPending: TInvitationRepo['listPending'] = (email) =>
      Effect.tryPromise({
        try: () =>
          invitationsWhere(
            db,
            and(
              eq(hackathonInvitation.inviteeEmail, email),
              eq(hackathonInvitation.status, HACKATHON_DECISION_STATUS.PENDING)
            )
          ),
        catch: (cause) => new EDatabase({ cause }),
      });

    const accept: TInvitationRepo['accept'] = (invitation, userId) =>
      Effect.tryPromise({
        try: () => invitationAccept(db, invitation, userId),
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: HACKATHON_MESSAGE.ALREADY_IN_TEAM })
            : new EDatabase({ cause }),
      });

    const reject: TInvitationRepo['reject'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .update(hackathonInvitation)
            .set({
              status: HACKATHON_DECISION_STATUS.REJECTED,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(hackathonInvitation.id, id),
                eq(
                  hackathonInvitation.status,
                  HACKATHON_DECISION_STATUS.PENDING
                )
              )
            )
            .returning({ id: hackathonInvitation.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return InvitationRepo.of({ create, find, listPending, accept, reject });
  })
);
