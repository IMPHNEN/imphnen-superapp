import { mentoringSessionRepoLayer } from '#/mentoring/infrastructure/mentoring-repository.ts';
import { mentoringRouterBuild } from '#/mentoring/presentation/mentoring-router.ts';

export const mentoringModule: {
  layer: typeof mentoringSessionRepoLayer;
  routerBuild: typeof mentoringRouterBuild;
} = {
  layer: mentoringSessionRepoLayer,
  routerBuild: mentoringRouterBuild,
};
