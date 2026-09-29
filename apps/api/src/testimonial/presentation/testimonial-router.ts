import { implementer } from '#/platform/orpc/implementer.ts';

const testimonialRouter = implementer.testimonial.router({});

export type TTestimonialRouter = typeof testimonialRouter;

export const testimonialRouterBuild = (): TTestimonialRouter =>
  testimonialRouter;
