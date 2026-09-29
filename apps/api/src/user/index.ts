import { userRepoLayer } from '#/user/infrastructure/user-repository.ts';
import { userRouterBuild } from '#/user/presentation/user-router.ts';

export const userModule: {
  layer: typeof userRepoLayer;
  routerBuild: typeof userRouterBuild;
} = {
  layer: userRepoLayer,
  routerBuild: userRouterBuild,
};
