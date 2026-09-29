import {
  type TPagination,
  type TTestimonialList,
  type TTestimonialListInput,
  type TTestimonialModerationListInput,
  TESTIMONIAL_SORT,
  TESTIMONIAL_STATUS,
  SORT_DIRECTION,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { toTestimonialDto } from '#/testimonial/application/to-testimonial-dto.ts';
import {
  TestimonialRepo,
  type TTestimonialListQuery,
  type TTestimonialRepoId,
} from '#/testimonial/domain/testimonial.ts';

const testimonialPage = Effect.fn('testimonialPage')(function* (
  query: TTestimonialListQuery
): Effect.fn.Return<TTestimonialList, EDatabase, TTestimonialRepoId> {
  const testimonialRepo = yield* TestimonialRepo;
  const { items, total } = yield* testimonialRepo.list(query);
  return {
    items: A.map(items, toTestimonialDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
});

export const testimonialList = (
  input: TTestimonialListInput
): Effect.Effect<TTestimonialList, EDatabase, TTestimonialRepoId> =>
  testimonialPage({ ...input, status: TESTIMONIAL_STATUS.APPROVED });

export const testimonialModerationList = (
  input: TTestimonialModerationListInput
): Effect.Effect<TTestimonialList, EDatabase, TTestimonialRepoId> =>
  testimonialPage(input);

export const testimonialMine = (
  input: TPagination,
  authorId: string
): Effect.Effect<TTestimonialList, EDatabase, TTestimonialRepoId> =>
  testimonialPage({
    ...input,
    authorId,
    sortBy: TESTIMONIAL_SORT.CREATED_AT,
    sortDir: SORT_DIRECTION.DESC,
  });
