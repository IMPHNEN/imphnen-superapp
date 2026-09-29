import { implementer } from '#/platform/orpc/implementer.ts';

const hackathonRouter = implementer.hackathon.router({});

export type THackathonRouter = typeof hackathonRouter;

export const hackathonRouterBuild = (): THackathonRouter => hackathonRouter;
