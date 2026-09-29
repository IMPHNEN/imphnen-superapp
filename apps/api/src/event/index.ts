import { eventRepoLayer } from '#/event/infrastructure/event-repository.ts';
import { eventRouterBuild } from '#/event/presentation/event-router.ts';

export const eventModule: {
  layer: typeof eventRepoLayer;
  routerBuild: typeof eventRouterBuild;
} = {
  layer: eventRepoLayer,
  routerBuild: eventRouterBuild,
};
