import { os } from '@orpc/server';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { TAppRouter } from '#/bootstrap/router.ts';
import { HTTP_STATUS } from '#/platform/http/http-status.ts';
import { orpcMount } from '#/platform/http/mount-orpc.ts';
import { ROUTE_PATH } from '@app/contract';
import { ROUTE_PREFIX } from '#/platform/http/route-paths.ts';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import { SESSION_STATE } from '#/shared/session.ts';

const URL_BASE = 'http://localhost';
const NOT_FOUND = 404;
const SPEC_PATH = `${ROUTE_PREFIX.OPENAPI}/spec.json`;
const HEALTH_PATH = `${ROUTE_PREFIX.OPENAPI}${ROUTE_PATH.HEALTH}`;
const CONTENT_TYPE_HEADER = 'content-type';
const HEALTH_BODY = { ok: true };

const logger = { error: (): void => undefined };

const routerFake = (): TAppRouter =>
  ({
    health: {
      check: os
        .$context<TORPCContext>()
        .route({ method: 'GET', path: ROUTE_PATH.HEALTH })
        .handler((): typeof HEALTH_BODY => HEALTH_BODY),
    },
  }) as unknown as TAppRouter;

const contextFake = async (headers: Headers): Promise<TORPCContext> =>
  ({
    headers,
    session: null,
    sessionState: SESSION_STATE.ANONYMOUS,
    permissions: [],
  }) as unknown as TORPCContext;

const appWith = (referenceEnabled: boolean): Hono => {
  const app = new Hono();
  orpcMount({
    app,
    router: routerFake(),
    logger,
    referenceEnabledGet: (): boolean => referenceEnabled,
    buildContext: contextFake,
  });
  return app;
};

const request = async (app: Hono, path: string): Promise<Response> =>
  await app.request(`${URL_BASE}${path}`);

describe('orpcMount', () => {
  it('serves the reference UI and the spec when the reference is enabled', async (): Promise<void> => {
    const app = appWith(true);

    const reference = await request(app, ROUTE_PREFIX.OPENAPI);
    const spec = await request(app, SPEC_PATH);

    expect(reference.status).toBe(HTTP_STATUS.OK);
    expect(reference.headers.get(CONTENT_TYPE_HEADER)).toContain('text/html');
    expect(spec.status).toBe(HTTP_STATUS.OK);
    expect(spec.headers.get(CONTENT_TYPE_HEADER)).toContain('json');
  });

  it('serves neither the reference UI nor the spec when the reference is disabled', async (): Promise<void> => {
    const app = appWith(false);

    const reference = await request(app, ROUTE_PREFIX.OPENAPI);
    const spec = await request(app, SPEC_PATH);

    expect(reference.status).toBe(NOT_FOUND);
    expect(spec.status).toBe(NOT_FOUND);
  });

  it('keeps serving the REST routes while the reference is disabled', async (): Promise<void> => {
    const response = await request(appWith(false), HEALTH_PATH);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual(HEALTH_BODY);
  });
});
