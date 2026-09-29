import {
  TESTIMONIAL_SORT,
  TESTIMONIAL_STATUS,
  type TTestimonialSort,
} from '@app/schemas';
import { and, eq, isNull, or, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { match, P } from 'ts-pattern';
import { containsWhere } from '#/platform/db/search.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { testimonial } from '#/platform/db/tables/testimonial.ts';
import type {
  TTestimonialListQuery,
  TTestimonialOwnerScope,
} from '#/testimonial/domain/testimonial.ts';

export const TESTIMONIAL_SORT_COLUMN: Record<
  TTestimonialSort,
  AnySQLiteColumn
> = {
  [TESTIMONIAL_SORT.CREATED_AT]: testimonial.createdAt,
  [TESTIMONIAL_SORT.UPDATED_AT]: testimonial.updatedAt,
};

export const testimonialViewColumns = {
  id: testimonial.id,
  userId: testimonial.userId,
  role: testimonial.role,
  content: testimonial.content,
  status: testimonial.status,
  reviewedBy: testimonial.reviewedBy,
  approvedAt: testimonial.approvedAt,
  deletedAt: testimonial.deletedAt,
  createdAt: testimonial.createdAt,
  updatedAt: testimonial.updatedAt,
  authorName: user.name,
  authorImage: user.image,
};

const liveWhere = isNull(testimonial.deletedAt);

const optionalWhere = <TValue>(
  value: TValue | undefined,
  build: (present: TValue) => SQL | undefined
): SQL | undefined =>
  match(value)
    .with(P.nonNullable, (present) => build(present as TValue))
    .otherwise(() => undefined);

export const testimonialListWhere = (
  query: TTestimonialListQuery
): SQL | undefined =>
  and(
    liveWhere,
    optionalWhere(query.status, (status) => eq(testimonial.status, status)),
    optionalWhere(query.authorId, (authorId) =>
      eq(testimonial.userId, authorId)
    ),
    optionalWhere(query.search, (search) =>
      or(
        containsWhere(testimonial.content, search),
        containsWhere(user.name, search)
      )
    )
  );

export const testimonialLiveByIdWhere = (id: string): SQL | undefined =>
  and(eq(testimonial.id, id), liveWhere);

export const testimonialScopedWhere = (
  id: string,
  scope: TTestimonialOwnerScope
): SQL | undefined =>
  match(scope)
    .with(null, () => testimonialLiveByIdWhere(id))
    .otherwise(({ ownerId }) =>
      and(
        testimonialLiveByIdWhere(id),
        eq(testimonial.userId, ownerId),
        eq(testimonial.status, TESTIMONIAL_STATUS.PENDING)
      )
    );
