import { Layer } from 'effect';
import { gachaClaimRepoLayer } from '#/gacha/infrastructure/gacha-claim-repository.ts';
import { gachaCreditRepoLayer } from '#/gacha/infrastructure/gacha-credit-repository.ts';
import { gachaItemRepoLayer } from '#/gacha/infrastructure/gacha-item-repository.ts';
import { gachaRollRepoLayer } from '#/gacha/infrastructure/gacha-roll-repository.ts';
import { gachaRouterBuild } from '#/gacha/presentation/gacha-router.ts';

const gachaLayer = Layer.mergeAll(
  gachaItemRepoLayer,
  gachaCreditRepoLayer,
  gachaClaimRepoLayer,
  gachaRollRepoLayer
);

export const gachaModule: {
  layer: typeof gachaLayer;
  routerBuild: typeof gachaRouterBuild;
} = {
  layer: gachaLayer,
  routerBuild: gachaRouterBuild,
};
