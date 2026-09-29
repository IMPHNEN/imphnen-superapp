import { Layer } from 'effect';
import { gachaRouterBuild } from '#/gacha/presentation/gacha-router.ts';

const gachaLayer = Layer.empty;

export const gachaModule: {
  layer: typeof gachaLayer;
  routerBuild: typeof gachaRouterBuild;
} = {
  layer: gachaLayer,
  routerBuild: gachaRouterBuild,
};
