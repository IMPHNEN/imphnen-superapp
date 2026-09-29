import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetailPrevious,
  activityDetails,
} from '@app/activity';
import { TESTIMONIAL_MESSAGE } from '@app/messages';
import type { TTestimonial, TTestimonialModerateInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import { testimonialViewFind } from '#/testimonial/application/testimonial-get.ts';
import { toTestimonialDto } from '#/testimonial/application/to-testimonial-dto.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
} from '#/testimonial/domain/testimonial.ts';

export const testimonialModerate = Effect.fn('testimonialModerate')(function* (
  { id, status }: TTestimonialModerateInput,
  actorId: string
): Effect.fn.Return<
  TTestimonial,
  ENotFound | EDatabase,
  TTestimonialRepoId | TActivityRecorderId
> {
  const testimonialRepo = yield* TestimonialRepo;
  const activityRepo = yield* ActivityRecorder;

  const existing = yield* testimonialViewFind(id);
  const row = yield* testimonialRepo.setStatus(id, status, actorId);

  if (row === null) {
    return yield* new ENotFound({ message: TESTIMONIAL_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.TESTIMONIAL_MODERATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.TESTIMONIAL,
    resourceId: id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.LABEL]: status,
      [ACTIVITY_DETAIL.PREVIOUS_LABEL]: activityDetailPrevious(
        existing.status,
        status
      ),
    }),
  });

  return toTestimonialDto({
    ...row,
    authorName: existing.authorName,
    authorImage: existing.authorImage,
  });
});
