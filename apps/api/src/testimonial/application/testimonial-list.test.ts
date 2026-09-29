import {
  SORT_DIRECTION,
  TESTIMONIAL_SORT,
  TESTIMONIAL_STATUS,
} from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { ENotFound } from '#/shared/errors.ts';
import { testimonialGet } from '#/testimonial/application/testimonial-get.ts';
import { testimonialList } from '#/testimonial/application/testimonial-list.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
  type TTestimonialView,
} from '#/testimonial/domain/testimonial.ts';

const TESTIMONIAL_ID = '11111111-1111-4111-8111-111111111111';

const pending: TTestimonialView = {
  id: TESTIMONIAL_ID,
  userId: '22222222-2222-4222-8222-222222222222',
  role: 'Engineer',
  content: 'Mantap',
  status: TESTIMONIAL_STATUS.PENDING,
  reviewedBy: null,
  approvedAt: null,
  deletedAt: null,
  authorName: null,
  authorImage: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const list = vi.fn().mockReturnValue(Effect.succeed({ items: [], total: 0 }));

const layer: Layer.Layer<TTestimonialRepoId> = Layer.succeed(
  TestimonialRepo,
  TestimonialRepo.of({
    list,
    findById: vi.fn().mockReturnValue(Effect.succeed(pending)),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    softDelete: vi.fn(),
  })
);

describe('testimonial public reads', () => {
  it('lists approved testimonials only', async (): Promise<void> => {
    await Effect.runPromise(
      testimonialList({
        page: 1,
        pageSize: 6,
        sortBy: TESTIMONIAL_SORT.CREATED_AT,
        sortDir: SORT_DIRECTION.DESC,
      }).pipe(Effect.provide(layer))
    );

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ status: TESTIMONIAL_STATUS.APPROVED })
    );
  });

  it('hides a testimonial that is not approved', async (): Promise<void> => {
    const error = await Effect.runPromise(
      testimonialGet({ id: TESTIMONIAL_ID }).pipe(
        Effect.provide(layer),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
