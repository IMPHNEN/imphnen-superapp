import { HEALTH_STATUS } from '@app/schemas';
import { APP_VERSION } from '@app/version';
import { implementer } from '#/platform/orpc/implementer.ts';

const healthRouter = implementer.health.router({
  check: implementer.health.check.handler(() => ({
    status: HEALTH_STATUS.OK,
    version: APP_VERSION,
  })),
});

export type THealthRouter = typeof healthRouter;

export const healthRouterBuild = (): THealthRouter => healthRouter;
