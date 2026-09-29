import {
  MENTORING_SESSION_STATUS,
  SORT_DIRECTION,
  type TSortDirection,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  sql,
  type AnyColumn,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import { match } from 'ts-pattern';
import type { TMentorRow } from '#/mentor/domain/mentor.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { mentoringSession } from '#/platform/db/tables/mentoring.ts';

const STATS_ALIAS = {
  TABLE: 'mentor_stats',
  RATING_AVERAGE: 'rating_average',
  RATING_COUNT: 'rating_count',
  COMPLETED_SESSION_COUNT: 'completed_session_count',
} as const;

export const mentorStats = new QueryBuilder()
  .select({
    mentorUserId: mentoringSession.mentorUserId,
    ratingAverage: sql<number | null>`avg(${mentoringSession.rating})`.as(
      STATS_ALIAS.RATING_AVERAGE
    ),
    ratingCount: sql<number>`count(${mentoringSession.rating})`.as(
      STATS_ALIAS.RATING_COUNT
    ),
    completedSessionCount:
      sql<number>`sum(case when ${mentoringSession.status} = ${MENTORING_SESSION_STATUS.COMPLETED} then 1 else 0 end)`.as(
        STATS_ALIAS.COMPLETED_SESSION_COUNT
      ),
  })
  .from(mentoringSession)
  .groupBy(mentoringSession.mentorUserId)
  .as(STATS_ALIAS.TABLE);

type TMentorSelected = {
  mentor: typeof mentor.$inferSelect;
  name: string;
  email: string;
  image: string | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  completedSessionCount: number | null;
};

export type TMentorQuery = {
  where: SQL | undefined;
  orderBy: readonly SQL[];
  limit: number;
  offset: number;
};

const toMentorRow = (selected: TMentorSelected): TMentorRow => ({
  ...selected.mentor,
  name: selected.name,
  email: selected.email,
  image: selected.image,
  ratingAverage:
    selected.ratingAverage === null ? null : Number(selected.ratingAverage),
  ratingCount: Number(selected.ratingCount ?? 0),
  completedSessionCount: Number(selected.completedSessionCount ?? 0),
});

export const mentorRowsSelect = async (
  db: TDb,
  query: TMentorQuery
): Promise<readonly TMentorRow[]> => {
  const rows = await db
    .select({
      mentor,
      name: user.name,
      email: user.email,
      image: user.image,
      ratingAverage: mentorStats.ratingAverage,
      ratingCount: mentorStats.ratingCount,
      completedSessionCount: mentorStats.completedSessionCount,
    })
    .from(mentor)
    .innerJoin(user, eq(user.id, mentor.userId))
    .leftJoin(mentorStats, eq(mentorStats.mentorUserId, mentor.userId))
    .where(query.where)
    .orderBy(...query.orderBy)
    .limit(query.limit)
    .offset(query.offset);
  return A.map(rows, toMentorRow);
};

export const mentorRowSelect = async (
  db: TDb,
  where: SQL | undefined
): Promise<TMentorRow | null> => {
  const [row] = await mentorRowsSelect(db, {
    where,
    orderBy: [],
    limit: 1,
    offset: 0,
  });
  return row ?? null;
};

export const mentorLiveWhere = (id: string): SQL | undefined =>
  and(eq(mentor.id, id), isNull(mentor.deletedAt));

export const mentorReread = async (
  db: TDb,
  written: readonly { id: string }[]
): Promise<TMentorRow | null> => {
  const [found] = written;
  return found === undefined
    ? null
    : mentorRowSelect(db, mentorLiveWhere(found.id));
};

export const sortBy = (
  expression: SQLWrapper | AnyColumn,
  direction: TSortDirection
): SQL =>
  match(direction)
    .with(SORT_DIRECTION.ASC, () => asc(expression))
    .with(SORT_DIRECTION.DESC, () => desc(expression))
    .exhaustive();

export const tagContainsWhere = (column: AnyColumn, value: string): SQL =>
  sql`exists (select 1 from json_each(${column}) where lower(json_each.value) = lower(${value}))`;
