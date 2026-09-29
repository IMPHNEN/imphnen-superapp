import {
  MENTOR_REVIEW_SORT,
  MENTOR_SORT,
  MENTOR_STATUS,
  type TMentorReviewSort,
  type TMentorSort,
} from '@app/schemas';
import { and, asc, count, desc, eq, isNull, or, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { Effect } from 'effect';
import type { TMentorRepo } from '#/mentor/domain/mentor.ts';
import {
  mentorRowSelect,
  mentorRowsSelect,
  mentorStats,
  sortBy,
  tagContainsWhere,
} from '#/mentor/infrastructure/mentor-select.ts';
import type { TDb } from '#/platform/db/client.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';

type TMentorReads = Pick<
  TMentorRepo,
  'publicList' | 'reviewList' | 'findById' | 'findByUserId'
>;

const PUBLIC_SORT = {
  [MENTOR_SORT.RATING]: mentorStats.ratingAverage,
  [MENTOR_SORT.SESSIONS]: mentorStats.completedSessionCount,
  [MENTOR_SORT.YEARS_OF_EXPERIENCE]: mentor.yearsOfExperience,
  [MENTOR_SORT.CREATED_AT]: mentor.createdAt,
} as const satisfies Record<TMentorSort, unknown>;

const REVIEW_SORT: Record<TMentorReviewSort, AnySQLiteColumn> = {
  [MENTOR_REVIEW_SORT.CREATED_AT]: mentor.createdAt,
  [MENTOR_REVIEW_SORT.UPDATED_AT]: mentor.updatedAt,
};

const optionalWhere = <TValue>(
  value: TValue | undefined,
  build: (found: TValue) => SQL | undefined
): SQL | undefined => (value === undefined ? undefined : build(value));

const TIE_BREAK: readonly SQL[] = [desc(mentor.createdAt), asc(mentor.id)];

export const mentorReadsBuild = (db: TDb): TMentorReads => {
  const counted = async (where: SQL | undefined): Promise<number> => {
    const [row] = await db
      .select({ value: count() })
      .from(mentor)
      .innerJoin(user, eq(user.id, mentor.userId))
      .where(where);
    return row?.value ?? 0;
  };

  const publicList: TMentorRepo['publicList'] = (input) => {
    const where = and(
      eq(mentor.status, MENTOR_STATUS.ACTIVE),
      isNull(mentor.deletedAt),
      optionalWhere(input.search, (search) =>
        or(
          containsWhere(user.name, search),
          containsWhere(mentor.currentRole, search),
          containsWhere(mentor.currentCompany, search)
        )
      ),
      optionalWhere(input.expertise, (tag) =>
        tagContainsWhere(mentor.expertise, tag)
      ),
      optionalWhere(input.industry, (tag) =>
        tagContainsWhere(mentor.industries, tag)
      )
    );

    return Effect.tryPromise({
      try: async () => {
        const [items, total] = await Promise.all([
          mentorRowsSelect(db, {
            where,
            orderBy: [
              sortBy(PUBLIC_SORT[input.sortBy], input.sortDir),
              ...TIE_BREAK,
            ],
            limit: input.pageSize,
            offset: offsetFor(input),
          }),
          counted(where),
        ]);
        return { items, total };
      },
      catch: (cause) => new EDatabase({ cause }),
    });
  };

  const reviewList: TMentorRepo['reviewList'] = (input) => {
    const where = and(
      isNull(mentor.deletedAt),
      optionalWhere(input.status, (status) => eq(mentor.status, status)),
      optionalWhere(input.search, (search) =>
        or(
          containsWhere(user.name, search),
          containsWhere(user.email, search),
          containsWhere(mentor.legalName, search)
        )
      )
    );

    return Effect.tryPromise({
      try: async () => {
        const [items, total] = await Promise.all([
          mentorRowsSelect(db, {
            where,
            orderBy: [
              sortBy(REVIEW_SORT[input.sortBy], input.sortDir),
              ...TIE_BREAK,
            ],
            limit: input.pageSize,
            offset: offsetFor(input),
          }),
          counted(where),
        ]);
        return { items, total };
      },
      catch: (cause) => new EDatabase({ cause }),
    });
  };

  const findById: TMentorRepo['findById'] = (id) =>
    Effect.tryPromise({
      try: () =>
        mentorRowSelect(db, and(eq(mentor.id, id), isNull(mentor.deletedAt))),
      catch: (cause) => new EDatabase({ cause }),
    });

  const findByUserId: TMentorRepo['findByUserId'] = (userId) =>
    Effect.tryPromise({
      try: () =>
        mentorRowSelect(
          db,
          and(eq(mentor.userId, userId), isNull(mentor.deletedAt))
        ),
      catch: (cause) => new EDatabase({ cause }),
    });

  return { publicList, reviewList, findById, findByUserId };
};
