import { implementer } from '#/platform/orpc/implementer.ts';

const eventRouter = implementer.event.router({});

export type TEventRouter = typeof eventRouter;

export const eventRouterBuild = (): TEventRouter => eventRouter;
