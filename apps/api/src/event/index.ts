import { Layer } from 'effect';
import { eventRouterBuild } from '#/event/presentation/event-router.ts';

const eventLayer = Layer.empty;

export const eventModule: {
  layer: typeof eventLayer;
  routerBuild: typeof eventRouterBuild;
} = {
  layer: eventLayer,
  routerBuild: eventRouterBuild,
};
