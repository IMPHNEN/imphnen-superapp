import {
  MENTORING_LIMIT,
  MENTORING_SESSION_STATUS,
  type TMentoringSessionStatus,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { count, countDistinct, desc, eq, sql, type SQL } from 'drizzle-orm';
import { Effect } from 'effect';
import type { TMentoringSessionRepo } from '#/mentoring/domain/mentoring-session.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { mentoringSession } from '#/platform/db/tables/mentoring.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';

type TSessionStats = Pick<
  TMentoringSessionRepo,
  'mentorStats' | 'menteeList' | 'overview'
>;

const whenStatus = (status: TMentoringSessionStatus): SQL =>
  sql`${mentoringSession.status} = ${status}`;

const countWhen = (condition: SQL): SQL<number> =>
  sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`;

const ratingAverage = sql<number | null>`avg(${mentoringSession.rating})`;

const asNullableNumber = (value: number | null): number | null =>
  value === null ? null : Number(value);

export const sessionStatsBuild = (db: TDb): TSessionStats => {
  const mentorStats: TMentoringSessionRepo['mentorStats'] = (
    mentorUserId,
    now
  ) =>
    Effect.tryPromise({
      try: async () => {
        const completed = whenStatus(MENTORING_SESSION_STATUS.COMPLETED);
        const [row] = await db
          .select({
            ratingAverage,
            ratingCount: count(mentoringSession.rating),
            completedSessionCount: countWhen(completed),
            menteesImpacted: sql<number>`count(distinct case when ${completed} then ${mentoringSession.menteeId} end)`,
            feedbackCount: count(mentoringSession.feedbackSubmittedAt),
            pendingSessionCount: countWhen(
              whenStatus(MENTORING_SESSION_STATUS.PENDING)
            ),
            upcomingSessionCount: countWhen(
              sql`${whenStatus(MENTORING_SESSION_STATUS.CONFIRMED)} and ${mentoringSession.scheduledAt} >= ${now.getTime()}`
            ),
          })
          .from(mentoringSession)
          .where(eq(mentoringSession.mentorUserId, mentorUserId));
        return {
          ratingAverage: asNullableNumber(row?.ratingAverage ?? null),
          ratingCount: Number(row?.ratingCount ?? 0),
          completedSessionCount: Number(row?.completedSessionCount ?? 0),
          menteesImpacted: Number(row?.menteesImpacted ?? 0),
          feedbackCount: Number(row?.feedbackCount ?? 0),
          pendingSessionCount: Number(row?.pendingSessionCount ?? 0),
          upcomingSessionCount: Number(row?.upcomingSessionCount ?? 0),
        };
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const menteeList: TMentoringSessionRepo['menteeList'] = (
    input,
    mentorUserId
  ) =>
    Effect.tryPromise({
      try: async () => {
        const where = eq(mentoringSession.mentorUserId, mentorUserId);
        const lastSessionAt = sql<number>`max(${mentoringSession.scheduledAt})`;
        const [rows, [counted]] = await Promise.all([
          db
            .select({
              userId: mentoringSession.menteeId,
              name: user.name,
              email: user.email,
              image: user.image,
              sessionCount: count(),
              completedSessionCount: countWhen(
                whenStatus(MENTORING_SESSION_STATUS.COMPLETED)
              ),
              lastSessionAt,
            })
            .from(mentoringSession)
            .innerJoin(user, eq(user.id, mentoringSession.menteeId))
            .where(where)
            .groupBy(mentoringSession.menteeId)
            .orderBy(desc(lastSessionAt), mentoringSession.menteeId)
            .limit(input.pageSize)
            .offset(offsetFor(input)),
          db
            .select({ value: countDistinct(mentoringSession.menteeId) })
            .from(mentoringSession)
            .where(where),
        ]);
        return {
          items: A.map(rows, (row) => ({
            ...row,
            completedSessionCount: Number(row.completedSessionCount),
            lastSessionAt: new Date(Number(row.lastSessionAt)),
          })),
          total: counted?.value ?? 0,
        };
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const overview: TMentoringSessionRepo['overview'] = () =>
    Effect.tryPromise({
      try: async () => {
        const topicCount = count();
        const [byStatus, [totals], topTopics] = await Promise.all([
          db
            .select({ status: mentoringSession.status, count: count() })
            .from(mentoringSession)
            .groupBy(mentoringSession.status),
          db
            .select({
              ratingAverage,
              feedbackCount: count(mentoringSession.feedbackSubmittedAt),
            })
            .from(mentoringSession),
          db
            .select({ topic: mentoringSession.topic, count: topicCount })
            .from(mentoringSession)
            .groupBy(mentoringSession.topic)
            .orderBy(desc(topicCount), mentoringSession.topic)
            .limit(MENTORING_LIMIT.TOP_TOPICS),
        ]);
        return {
          total: A.reduce(byStatus, 0, (sum, row) => sum + row.count),
          byStatus: [...byStatus],
          ratingAverage: asNullableNumber(totals?.ratingAverage ?? null),
          feedbackCount: totals?.feedbackCount ?? 0,
          topTopics: [...topTopics],
        };
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  return { mentorStats, menteeList, overview };
};
