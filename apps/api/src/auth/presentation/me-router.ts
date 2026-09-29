import { implementer, sessionGuarded } from '#/platform/orpc/implementer.ts';

const meRouter = implementer.me.router({
  get: sessionGuarded.me.get.handler(({ context }) => ({
    user: context.session.user,
    permissions: [...context.permissions],
  })),
});

export type TMeRouter = typeof meRouter;

export const meRouterBuild = (): TMeRouter => meRouter;
