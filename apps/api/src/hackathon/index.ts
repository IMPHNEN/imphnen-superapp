import { hackathonRepoLayer } from '#/hackathon/infrastructure/hackathon-layer.ts';
import { hackathonRouterBuild } from '#/hackathon/presentation/hackathon-router.ts';

export const hackathonModule: {
  layer: typeof hackathonRepoLayer;
  routerBuild: typeof hackathonRouterBuild;
} = {
  layer: hackathonRepoLayer,
  routerBuild: hackathonRouterBuild,
};
