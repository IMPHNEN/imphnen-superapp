import { testimonialRepoLayer } from '#/testimonial/infrastructure/testimonial-repository.ts';
import { testimonialRouterBuild } from '#/testimonial/presentation/testimonial-router.ts';

export const testimonialModule: {
  layer: typeof testimonialRepoLayer;
  routerBuild: typeof testimonialRouterBuild;
} = {
  layer: testimonialRepoLayer,
  routerBuild: testimonialRouterBuild,
};
