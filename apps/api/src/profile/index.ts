import { profileRepoLayer } from '#/profile/infrastructure/profile-repository.ts';
import { profileRouterBuild } from '#/profile/presentation/profile-router.ts';

export const profileModule: {
  layer: typeof profileRepoLayer;
  routerBuild: typeof profileRouterBuild;
} = {
  layer: profileRepoLayer,
  routerBuild: profileRouterBuild,
};
