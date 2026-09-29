import { PERMISSION } from '@app/permissions';
import {
  implementer,
  permissionGuarded,
  sessionGuarded,
} from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { testimonialCreate } from '#/testimonial/application/testimonial-create.ts';
import { testimonialDelete } from '#/testimonial/application/testimonial-delete.ts';
import { testimonialGet } from '#/testimonial/application/testimonial-get.ts';
import {
  testimonialList,
  testimonialMine,
  testimonialModerationList,
} from '#/testimonial/application/testimonial-list.ts';
import { testimonialModerate } from '#/testimonial/application/testimonial-moderate.ts';
import { testimonialUpdate } from '#/testimonial/application/testimonial-update.ts';

const testimonialRouter = implementer.testimonial.router({
  list: implementer.testimonial.list.handler(({ input, context }) =>
    effectRun(context.runtime, testimonialList(input))
  ),

  get: implementer.testimonial.get.handler(({ input, context }) =>
    effectRun(context.runtime, testimonialGet(input))
  ),

  mine: permissionGuarded(
    PERMISSION.TESTIMONIAL_CREATE
  ).testimonial.mine.handler(({ input, context }) =>
    effectRun(context.runtime, testimonialMine(input, context.session.user.id))
  ),

  moderationList: permissionGuarded(
    PERMISSION.TESTIMONIAL_MODERATE
  ).testimonial.moderationList.handler(({ input, context }) =>
    effectRun(context.runtime, testimonialModerationList(input))
  ),

  create: permissionGuarded(
    PERMISSION.TESTIMONIAL_CREATE
  ).testimonial.create.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      testimonialCreate(input, context.session.user.id)
    )
  ),

  update: sessionGuarded.testimonial.update.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      testimonialUpdate(input, {
        id: context.session.user.id,
        permissions: context.permissions,
      })
    )
  ),

  moderate: permissionGuarded(
    PERMISSION.TESTIMONIAL_MODERATE
  ).testimonial.moderate.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      testimonialModerate(input, context.session.user.id)
    )
  ),

  remove: sessionGuarded.testimonial.remove.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      testimonialDelete(input, {
        id: context.session.user.id,
        permissions: context.permissions,
      })
    )
  ),
});

export type TTestimonialRouter = typeof testimonialRouter;

export const testimonialRouterBuild = (): TTestimonialRouter =>
  testimonialRouter;
