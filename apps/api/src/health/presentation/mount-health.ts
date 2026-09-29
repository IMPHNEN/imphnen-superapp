import { HEALTH_STATUS, type TReadiness } from '@app/schemas';
import { APP_VERSION } from '@app/version';
import type { Hono } from 'hono';
import { match } from 'ts-pattern';
import { HTTP_STATUS } from '#/platform/http/http-status.ts';
import { ROUTE_PATH } from '@app/contract';

export type THealthMountDeps = {
  readiness: () => Promise<TReadiness>;
};

export const healthMount = (app: Hono, deps: THealthMountDeps): void => {
  app.get(ROUTE_PATH.HEALTHZ, (context) =>
    context.json({ status: HEALTH_STATUS.OK, version: APP_VERSION })
  );

  app.get(ROUTE_PATH.READY, async (context) => {
    const readiness = await deps.readiness();

    return match(readiness.status)
      .with(
        HEALTH_STATUS.READY,
        (): Response => context.json(readiness, HTTP_STATUS.OK)
      )
      .otherwise(
        (): Response => context.json(readiness, HTTP_STATUS.SERVICE_UNAVAILABLE)
      );
  });
};
