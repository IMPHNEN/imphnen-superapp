import { Layer } from 'effect';
import { mentorRouterBuild } from '#/mentor/presentation/mentor-router.ts';

const mentorLayer = Layer.empty;

export const mentorModule: {
  layer: typeof mentorLayer;
  routerBuild: typeof mentorRouterBuild;
} = {
  layer: mentorLayer,
  routerBuild: mentorRouterBuild,
};
