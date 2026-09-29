import { Layer } from 'effect';
import { testimonialRouterBuild } from '#/testimonial/presentation/testimonial-router.ts';

const testimonialLayer = Layer.empty;

export const testimonialModule: {
  layer: typeof testimonialLayer;
  routerBuild: typeof testimonialRouterBuild;
} = {
  layer: testimonialLayer,
  routerBuild: testimonialRouterBuild,
};
