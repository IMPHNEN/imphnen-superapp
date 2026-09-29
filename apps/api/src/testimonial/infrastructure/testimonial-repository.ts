import { TESTIMONIAL_STATUS } from '@app/schemas';
import { count, eq } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { testimonial } from '#/platform/db/tables/testimonial.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';
import {
  TestimonialRepo,
  type TTestimonialRepo,
} from '#/testimonial/domain/testimonial.ts';
import {
  TESTIMONIAL_SORT_COLUMN,
  testimonialListWhere,
  testimonialLiveByIdWhere,
  testimonialScopedWhere,
  testimonialViewColumns,
} from '#/testimonial/infrastructure/testimonial-query.ts';

export const testimonialRepoLayer = Layer.effect(
  TestimonialRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TTestimonialRepo['list'] = (query) => {
      const where = testimonialListWhere(query);
      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select(testimonialViewColumns)
              .from(testimonial)
              .leftJoin(user, eq(user.id, testimonial.userId))
              .where(where)
              .limit(query.pageSize)
              .offset(offsetFor(query))
              .orderBy(
                orderFor(TESTIMONIAL_SORT_COLUMN[query.sortBy], query.sortDir)
              ),
            db
              .select({ value: count() })
              .from(testimonial)
              .leftJoin(user, eq(user.id, testimonial.userId))
              .where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TTestimonialRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(testimonialViewColumns)
            .from(testimonial)
            .leftJoin(user, eq(user.id, testimonial.userId))
            .where(testimonialLiveByIdWhere(id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TTestimonialRepo['create'] = (input, authorId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .insert(testimonial)
            .values({
              userId: authorId,
              role: input.role,
              content: input.content,
              status: TESTIMONIAL_STATUS.PENDING,
            })
            .returning();
          return row;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const update: TTestimonialRepo['update'] = (id, input, scope) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(testimonial)
            .set({
              role: input.role,
              content: input.content,
              updatedAt: new Date(),
            })
            .where(testimonialScopedWhere(id, scope))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const setStatus: TTestimonialRepo['setStatus'] = (id, status, reviewerId) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const [row] = await db
            .update(testimonial)
            .set({
              status,
              reviewedBy: reviewerId,
              approvedAt: status === TESTIMONIAL_STATUS.APPROVED ? now : null,
              updatedAt: now,
            })
            .where(testimonialLiveByIdWhere(id))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const softDelete: TTestimonialRepo['softDelete'] = (id, scope) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const [row] = await db
            .update(testimonial)
            .set({ deletedAt: now, updatedAt: now })
            .where(testimonialScopedWhere(id, scope))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return TestimonialRepo.of({
      list,
      findById,
      create,
      update,
      setStatus,
      softDelete,
    });
  })
);
