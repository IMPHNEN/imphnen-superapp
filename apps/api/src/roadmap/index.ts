import { Layer } from 'effect';
import { roadmapRouterBuild } from '#/roadmap/presentation/roadmap-router.ts';

const roadmapLayer = Layer.empty;

export const roadmapModule: {
  layer: typeof roadmapLayer;
  routerBuild: typeof roadmapRouterBuild;
} = {
  layer: roadmapLayer,
  routerBuild: roadmapRouterBuild,
};
