import { implementer } from '#/platform/orpc/implementer.ts';

const roadmapRouter = implementer.roadmap.router({});

export type TRoadmapRouter = typeof roadmapRouter;

export const roadmapRouterBuild = (): TRoadmapRouter => roadmapRouter;
