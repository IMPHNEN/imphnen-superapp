import { canAll, PERMISSION, type TPermission } from '@app/permissions';
import { TESTIMONIAL_STATUS } from '@app/schemas';
import { match } from 'ts-pattern';
import type {
  TTestimonialOwnerScope,
  TTestimonialRow,
} from '#/testimonial/domain/testimonial.ts';

export type TTestimonialActor = {
  id: string;
  permissions: readonly TPermission[];
};

export const testimonialOwnerScope = (
  actor: TTestimonialActor
): TTestimonialOwnerScope =>
  canAll(actor.permissions, [PERMISSION.TESTIMONIAL_MODERATE])
    ? null
    : { ownerId: actor.id };

export const testimonialCanChange = (
  actor: TTestimonialActor,
  row: TTestimonialRow
): boolean =>
  match(testimonialOwnerScope(actor))
    .with(null, (): boolean => true)
    .otherwise(
      (scope): boolean =>
        canAll(actor.permissions, [PERMISSION.TESTIMONIAL_CREATE]) &&
        row.userId === scope.ownerId &&
        row.status === TESTIMONIAL_STATUS.PENDING
    );
