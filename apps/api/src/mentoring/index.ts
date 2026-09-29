import { Layer } from 'effect';
import { mentoringRouterBuild } from '#/mentoring/presentation/mentoring-router.ts';

const mentoringLayer = Layer.empty;

export const mentoringModule: {
  layer: typeof mentoringLayer;
  routerBuild: typeof mentoringRouterBuild;
} = {
  layer: mentoringLayer,
  routerBuild: mentoringRouterBuild,
};
