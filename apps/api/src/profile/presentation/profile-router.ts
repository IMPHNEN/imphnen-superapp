import { implementer } from '#/platform/orpc/implementer.ts';

const profileRouter = implementer.profile.router({});

export type TProfileRouter = typeof profileRouter;

export const profileRouterBuild = (): TProfileRouter => profileRouter;
