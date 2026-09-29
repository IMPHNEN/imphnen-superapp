import {
  MENTORING_PARTICIPANT_ROLE,
  type TMentoringListMineInput,
  type TMentoringManageListInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import {
  and,
  asc,
  count,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import type { TMentoringSessionRepo } from '#/mentoring/domain/mentoring-session.ts';
import { MINUTE_MS } from '#/mentoring/domain/mentoring-schedule.ts';
import { SESSION_OPEN } from '#/mentoring/domain/session-status.ts';
import {
  sessionRowSelect,
  sessionRowsSelect,
} from '#/mentoring/infrastructure/session-select.ts';
import type { TDb } from '#/platform/db/client.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { mentoringSession } from '#/platform/db/tables/mentoring.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';

type TSessionReads = Pick<
  TMentoringSessionRepo,
  'findById' | 'listFor' | 'manageList' | 'busy'
>;

type TSessionFilter = Pick<
  TMentoringManageListInput,
  'status' | 'hasFeedback' | 'rating'
>;

const optionalWhere = <TValue>(
  value: TValue | undefined,
  build: (found: TValue) => SQL | undefined
): SQL | undefined => (value === undefined ? undefined : build(value));

const filterWhere = (input: TSessionFilter): SQL | undefined =>
  and(
    optionalWhere(input.status, (status) =>
      eq(mentoringSession.status, status)
    ),
    optionalWhere(input.hasFeedback, (hasFeedback) =>
      hasFeedback
        ? isNotNull(mentoringSession.feedbackSubmittedAt)
        : isNull(mentoringSession.feedbackSubmittedAt)
    ),
    optionalWhere(input.rating, (rating) => eq(mentoringSession.rating, rating))
  );

const participantWhere = (
  input: TMentoringListMineInput,
  userId: string
): SQL =>
  match(input.role)
    .with(MENTORING_PARTICIPANT_ROLE.MENTEE, () =>
      eq(mentoringSession.menteeId, userId)
    )
    .with(MENTORING_PARTICIPANT_ROLE.MENTOR, () =>
      eq(mentoringSession.mentorUserId, userId)
    )
    .exhaustive();

const sessionEnd = sql`${mentoringSession.scheduledAt} + ${mentoringSession.durationMinutes} * ${MINUTE_MS}`;

export const sessionReadsBuild = (db: TDb): TSessionReads => {
  const paged = (
    where: SQL | undefined,
    input: TMentoringManageListInput | TMentoringListMineInput
  ): ReturnType<TMentoringSessionRepo['manageList']> =>
    Effect.tryPromise({
      try: async () => {
        const [items, [counted]] = await Promise.all([
          sessionRowsSelect(db, {
            where,
            orderBy: [
              orderFor(mentoringSession.scheduledAt, input.sortDir),
              asc(mentoringSession.id),
            ],
            limit: input.pageSize,
            offset: offsetFor(input),
          }),
          db.select({ value: count() }).from(mentoringSession).where(where),
        ]);
        return { items, total: counted?.value ?? 0 };
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const findById: TMentoringSessionRepo['findById'] = (id) =>
    Effect.tryPromise({
      try: () => sessionRowSelect(db, id),
      catch: (cause) => new EDatabase({ cause }),
    });

  const listFor: TMentoringSessionRepo['listFor'] = (input, userId) =>
    paged(and(participantWhere(input, userId), filterWhere(input)), input);

  const manageList: TMentoringSessionRepo['manageList'] = (input) =>
    paged(
      and(
        filterWhere(input),
        optionalWhere(input.mentorUserId, (id) =>
          eq(mentoringSession.mentorUserId, id)
        ),
        optionalWhere(input.menteeId, (id) =>
          eq(mentoringSession.menteeId, id)
        ),
        optionalWhere(input.search, (search) =>
          containsWhere(mentoringSession.topic, search)
        )
      ),
      input
    );

  const busy: TMentoringSessionRepo['busy'] = (mentorUserId, from, to) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await db
          .select({
            start: mentoringSession.scheduledAt,
            durationMinutes: mentoringSession.durationMinutes,
          })
          .from(mentoringSession)
          .where(
            and(
              eq(mentoringSession.mentorUserId, mentorUserId),
              inArray(mentoringSession.status, [...SESSION_OPEN]),
              lt(mentoringSession.scheduledAt, to),
              gt(sessionEnd, from.getTime())
            )
          )
          .orderBy(asc(mentoringSession.scheduledAt));
        return A.map(rows, (row) => ({
          start: row.start,
          end: new Date(row.start.getTime() + row.durationMinutes * MINUTE_MS),
        }));
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  return { findById, listFor, manageList, busy };
};
