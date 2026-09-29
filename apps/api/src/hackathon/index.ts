import { Layer } from 'effect';
import { hackathonRouterBuild } from '#/hackathon/presentation/hackathon-router.ts';

const hackathonLayer = Layer.empty;

export const hackathonModule: {
  layer: typeof hackathonLayer;
  routerBuild: typeof hackathonRouterBuild;
} = {
  layer: hackathonLayer,
  routerBuild: hackathonRouterBuild,
};
