import { implementer, sessionAware } from '#/platform/orpc/implementer.ts';

const meRouter = implementer.me.router({
  get: sessionAware.me.get.handler(({ context }) =>
    context.session === null
      ? null
      : {
          user: context.session.user,
          permissions: [...context.permissions],
        }
  ),
});

export type TMeRouter = typeof meRouter;

export const meRouterBuild = (): TMeRouter => meRouter;
