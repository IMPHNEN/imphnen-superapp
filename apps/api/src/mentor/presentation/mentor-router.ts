import { implementer } from '#/platform/orpc/implementer.ts';

const mentorRouter = implementer.mentor.router({});

export type TMentorRouter = typeof mentorRouter;

export const mentorRouterBuild = (): TMentorRouter => mentorRouter;
