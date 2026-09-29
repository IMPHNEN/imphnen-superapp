import { implementer } from '#/platform/orpc/implementer.ts';

const mentoringRouter = implementer.mentoring.router({});

export type TMentoringRouter = typeof mentoringRouter;

export const mentoringRouterBuild = (): TMentoringRouter => mentoringRouter;
