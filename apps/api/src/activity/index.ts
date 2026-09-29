import { ActivityPruner, ActivityRepo } from '#/activity/domain/activity.ts';
import type {
  TActivityPrunerId,
  TActivityRepoId,
} from '#/activity/domain/activity.ts';
import { activityPrune } from '#/activity/application/activity-prune.ts';
import {
  activityPrunerLayer,
  activityRecorderLayer,
  activityRepoLayer,
} from '#/activity/infrastructure/activity-repository.ts';
import { activityRouterBuild } from '#/activity/presentation/activity-router.ts';
import { Layer } from 'effect';

export { ActivityPruner, ActivityRepo };
export type { TActivityPrunerId, TActivityRepoId };

const activityLayer = Layer.mergeAll(
  activityRecorderLayer,
  activityRepoLayer,
  activityPrunerLayer
);

export const activityModule: {
  layer: typeof activityLayer;
  routerBuild: typeof activityRouterBuild;
  prune: typeof activityPrune;
} = {
  layer: activityLayer,
  routerBuild: activityRouterBuild,
  prune: activityPrune,
};
