import { MENTOR_STATUS, MENTORING_SESSION_STATUS } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { and, eq, isNull, sql, type SQLChunk } from 'drizzle-orm';
import { Effect } from 'effect';
import type { TMentoringSessionRepo } from '#/mentoring/domain/mentoring-session.ts';
import {
  MINUTE_MS,
  sessionEndOf,
} from '#/mentoring/domain/mentoring-schedule.ts';
import { SESSION_OPEN } from '#/mentoring/domain/session-status.ts';
import { sessionReread } from '#/mentoring/infrastructure/session-select.ts';
import type { TDb } from '#/platform/db/client.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { mentoringSession } from '#/platform/db/tables/mentoring.ts';
import { EDatabase } from '#/shared/errors.ts';

type TSessionWrites = Pick<
  TMentoringSessionRepo,
  'book' | 'change' | 'feedbackSet'
>;

const SQL_LIST_SEPARATOR = sql`, `;

const INSERT_COLUMNS = sql.join(
  [
    ...A.map(
      [
        mentoringSession.id,
        mentoringSession.mentorUserId,
        mentoringSession.menteeId,
        mentoringSession.topic,
        mentoringSession.description,
        mentoringSession.scheduledAt,
        mentoringSession.durationMinutes,
        mentoringSession.sessionType,
        mentoringSession.status,
        mentoringSession.createdAt,
        mentoringSession.updatedAt,
      ],
      (column): SQLChunk => sql.identifier(column.name)
    ),
  ],
  SQL_LIST_SEPARATOR
);

const OPEN_STATUSES = sql.join(
  [...A.map(SESSION_OPEN, (status): SQLChunk => sql`${status}`)],
  SQL_LIST_SEPARATOR
);

export const sessionWritesBuild = (db: TDb): TSessionWrites => {
  const book: TMentoringSessionRepo['book'] = (input, menteeId) =>
    Effect.tryPromise({
      try: async () => {
        const id = crypto.randomUUID();
        const start = new Date(input.scheduledAt);
        const end = sessionEndOf(start, input.durationMinutes);
        const now = Date.now();
        const written = await db.all<{ id: string }>(sql`
          insert into ${mentoringSession} (${INSERT_COLUMNS})
          select ${id}, ${input.mentorUserId}, ${menteeId}, ${input.topic},
            ${input.description ?? null}, ${start.getTime()},
            ${input.durationMinutes}, ${input.sessionType},
            ${MENTORING_SESSION_STATUS.PENDING}, ${now}, ${now}
          from ${mentor}
          where ${mentor.userId} = ${input.mentorUserId}
            and ${mentor.status} = ${MENTOR_STATUS.ACTIVE}
            and ${mentor.deletedAt} is null
            and not exists (
              select 1 from ${mentoringSession}
              where ${mentoringSession.mentorUserId} = ${input.mentorUserId}
                and ${mentoringSession.status} in (${OPEN_STATUSES})
                and ${mentoringSession.scheduledAt} < ${end.getTime()}
                and ${mentoringSession.scheduledAt} + ${mentoringSession.durationMinutes} * ${MINUTE_MS} > ${start.getTime()}
            )
          returning ${sql.identifier(mentoringSession.id.name)}
        `);
        return sessionReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const change: TMentoringSessionRepo['change'] = (id, from, next) =>
    Effect.tryPromise({
      try: async () => {
        const written = await db
          .update(mentoringSession)
          .set({ ...next, updatedAt: new Date() })
          .where(
            and(eq(mentoringSession.id, id), eq(mentoringSession.status, from))
          )
          .returning({ id: mentoringSession.id });
        return sessionReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const feedbackSet: TMentoringSessionRepo['feedbackSet'] = (input, menteeId) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const written = await db
          .update(mentoringSession)
          .set({
            feedback: input.feedback,
            rating: input.rating,
            feedbackSubmittedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(mentoringSession.id, input.id),
              eq(mentoringSession.menteeId, menteeId),
              eq(mentoringSession.status, MENTORING_SESSION_STATUS.COMPLETED),
              isNull(mentoringSession.feedbackSubmittedAt)
            )
          )
          .returning({ id: mentoringSession.id });
        return sessionReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  return { book, change, feedbackSet };
};
