import {
  paginationSchema,
  testimonialCreateInputSchema,
  testimonialIdInputSchema,
  testimonialListInputSchema,
  testimonialListSchema,
  testimonialModerateInputSchema,
  testimonialModerationListInputSchema,
  testimonialSchema,
  testimonialUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const testimonialContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.TESTIMONIALS })
    .input(testimonialListInputSchema)
    .output(testimonialListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.TESTIMONIAL })
    .input(testimonialIdInputSchema)
    .output(testimonialSchema),

  mine: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.TESTIMONIALS_MINE })
    .input(paginationSchema)
    .output(testimonialListSchema),

  moderationList: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.TESTIMONIALS_MODERATION,
    })
    .input(testimonialModerationListInputSchema)
    .output(testimonialListSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.TESTIMONIALS })
    .input(testimonialCreateInputSchema)
    .output(testimonialSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.TESTIMONIAL })
    .input(testimonialUpdateInputSchema)
    .output(testimonialSchema),

  moderate: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.TESTIMONIAL_STATUS })
    .input(testimonialModerateInputSchema)
    .output(testimonialSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.TESTIMONIAL })
    .input(testimonialIdInputSchema)
    .output(testimonialIdInputSchema),
};
