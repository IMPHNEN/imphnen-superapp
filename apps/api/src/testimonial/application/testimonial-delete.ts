import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';
import { TESTIMONIAL_MESSAGE } from '@app/messages';
import type { TTestimonialIdInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, EForbidden, type ENotFound } from '#/shared/errors.ts';
import { testimonialViewFind } from '#/testimonial/application/testimonial-get.ts';
import {
  type TTestimonialActor,
  testimonialCanChange,
  testimonialOwnerScope,
} from '#/testimonial/domain/testimonial-access.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
} from '#/testimonial/domain/testimonial.ts';

export const testimonialDelete = Effect.fn('testimonialDelete')(function* (
  { id }: TTestimonialIdInput,
  actor: TTestimonialActor
): Effect.fn.Return<
  TTestimonialIdInput,
  ENotFound | EForbidden | EDatabase,
  TTestimonialRepoId | TActivityRecorderId
> {
  const testimonialRepo = yield* TestimonialRepo;
  const activityRepo = yield* ActivityRecorder;

  const existing = yield* testimonialViewFind(id);

  if (!testimonialCanChange(actor, existing)) {
    return yield* new EForbidden({ message: TESTIMONIAL_MESSAGE.NOT_EDITABLE });
  }

  const row = yield* testimonialRepo.softDelete(
    id,
    testimonialOwnerScope(actor)
  );

  if (row === null) {
    return yield* new EForbidden({ message: TESTIMONIAL_MESSAGE.NOT_EDITABLE });
  }

  yield* activityRepo.insert({
    actorId: actor.id,
    action: ACTIVITY_ACTION.TESTIMONIAL_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.TESTIMONIAL,
    resourceId: id,
  });

  return { id };
});
