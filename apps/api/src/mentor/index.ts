import {
  MentorRepo,
  type TMentorRepoId,
  type TMentorRow,
} from '#/mentor/domain/mentor.ts';
import { mentorIsPublic } from '#/mentor/domain/mentor-status.ts';
import { mentorRepoLayer } from '#/mentor/infrastructure/mentor-repository.ts';
import { mentorRouterBuild } from '#/mentor/presentation/mentor-router.ts';

export { MentorRepo, mentorIsPublic };
export type { TMentorRepoId, TMentorRow };

export const mentorModule: {
  layer: typeof mentorRepoLayer;
  routerBuild: typeof mentorRouterBuild;
} = {
  layer: mentorRepoLayer,
  routerBuild: mentorRouterBuild,
};
