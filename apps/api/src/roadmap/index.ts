import { roadmapItemRepoLayer } from '#/roadmap/infrastructure/roadmap-repository.ts';
import { roadmapRouterBuild } from '#/roadmap/presentation/roadmap-router.ts';

export const roadmapModule: {
  layer: typeof roadmapItemRepoLayer;
  routerBuild: typeof roadmapRouterBuild;
} = {
  layer: roadmapItemRepoLayer,
  routerBuild: roadmapRouterBuild,
};
