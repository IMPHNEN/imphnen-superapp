import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';
import type { TTestimonial, TTestimonialCreateInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { EDatabase, ENotFound } from '#/shared/errors.ts';
import { testimonialViewFind } from '#/testimonial/application/testimonial-get.ts';
import { toTestimonialDto } from '#/testimonial/application/to-testimonial-dto.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
} from '#/testimonial/domain/testimonial.ts';

export const testimonialCreate = Effect.fn('testimonialCreate')(function* (
  input: TTestimonialCreateInput,
  actorId: string
): Effect.fn.Return<
  TTestimonial,
  ENotFound | EDatabase,
  TTestimonialRepoId | TActivityRecorderId
> {
  const testimonialRepo = yield* TestimonialRepo;
  const activityRepo = yield* ActivityRecorder;

  const row = yield* testimonialRepo.create(input, actorId);

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.TESTIMONIAL_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.TESTIMONIAL,
    resourceId: row.id,
  });

  return toTestimonialDto(yield* testimonialViewFind(row.id));
});
