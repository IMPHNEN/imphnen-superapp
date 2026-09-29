import { PERMISSION } from '@app/permissions';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { roadmapGet, roadmapList } from '#/roadmap/application/roadmap-read.ts';
import { roadmapVote } from '#/roadmap/application/roadmap-vote.ts';
import {
  roadmapCreate,
  roadmapDelete,
  roadmapUpdate,
} from '#/roadmap/application/roadmap-write.ts';

const roadmapRouter = implementer.roadmap.router({
  list: implementer.roadmap.list.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      roadmapList(input, context.session?.user.id ?? null)
    )
  ),

  get: implementer.roadmap.get.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      roadmapGet(input, context.session?.user.id ?? null)
    )
  ),

  vote: permissionGuarded(PERMISSION.ROADMAP_VOTE).roadmap.vote.handler(
    ({ input, context }) =>
      effectRun(context.runtime, roadmapVote(input, context.session.user.id))
  ),

  create: permissionGuarded(PERMISSION.ROADMAP_CREATE).roadmap.create.handler(
    ({ input, context }) =>
      effectRun(context.runtime, roadmapCreate(input, context.session.user.id))
  ),

  update: permissionGuarded(PERMISSION.ROADMAP_UPDATE).roadmap.update.handler(
    ({ input, context }) =>
      effectRun(context.runtime, roadmapUpdate(input, context.session.user.id))
  ),

  remove: permissionGuarded(PERMISSION.ROADMAP_DELETE).roadmap.remove.handler(
    ({ input, context }) =>
      effectRun(context.runtime, roadmapDelete(input, context.session.user.id))
  ),
});

export type TRoadmapRouter = typeof roadmapRouter;

export const roadmapRouterBuild = (): TRoadmapRouter => roadmapRouter;
