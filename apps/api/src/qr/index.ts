import { Layer } from 'effect';
import { qrRouterBuild } from '#/qr/presentation/qr-router.ts';

const qrLayer = Layer.empty;

export const qrModule: {
  layer: typeof qrLayer;
  routerBuild: typeof qrRouterBuild;
} = {
  layer: qrLayer,
  routerBuild: qrRouterBuild,
};
