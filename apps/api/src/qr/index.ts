import { Layer } from 'effect';
import { qrCampaignRepoLayer } from '#/qr/infrastructure/qr-campaign-repository.ts';
import { qrWatermarkerLayer } from '#/qr/infrastructure/qr-watermarker.ts';
import { qrRouterBuild } from '#/qr/presentation/qr-router.ts';

const qrLayer = Layer.mergeAll(qrCampaignRepoLayer, qrWatermarkerLayer);

export const qrModule: {
  layer: typeof qrLayer;
  routerBuild: typeof qrRouterBuild;
} = {
  layer: qrLayer,
  routerBuild: qrRouterBuild,
};
