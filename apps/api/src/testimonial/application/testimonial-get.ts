import { TESTIMONIAL_MESSAGE } from '@app/messages';
import {
  TESTIMONIAL_STATUS,
  type TTestimonial,
  type TTestimonialIdInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import { toTestimonialDto } from '#/testimonial/application/to-testimonial-dto.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
  type TTestimonialView,
} from '#/testimonial/domain/testimonial.ts';

export const testimonialViewFind = Effect.fn('testimonialViewFind')(function* (
  id: string
): Effect.fn.Return<
  TTestimonialView,
  ENotFound | EDatabase,
  TTestimonialRepoId
> {
  const testimonialRepo = yield* TestimonialRepo;
  const view = yield* testimonialRepo.findById(id);

  if (view === null) {
    return yield* new ENotFound({ message: TESTIMONIAL_MESSAGE.NOT_FOUND });
  }

  return view;
});

export const testimonialGet = Effect.fn('testimonialGet')(function* ({
  id,
}: TTestimonialIdInput): Effect.fn.Return<
  TTestimonial,
  ENotFound | EDatabase,
  TTestimonialRepoId
> {
  const view = yield* testimonialViewFind(id);

  if (view.status !== TESTIMONIAL_STATUS.APPROVED) {
    return yield* new ENotFound({ message: TESTIMONIAL_MESSAGE.NOT_FOUND });
  }

  return toTestimonialDto(view);
});
