import { Layer } from 'effect';
import { profileRouterBuild } from '#/profile/presentation/profile-router.ts';

const profileLayer = Layer.empty;

export const profileModule: {
  layer: typeof profileLayer;
  routerBuild: typeof profileRouterBuild;
} = {
  layer: profileLayer,
  routerBuild: profileRouterBuild,
};
