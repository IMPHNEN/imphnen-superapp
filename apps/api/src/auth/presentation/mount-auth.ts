import type { Hono } from 'hono';
import type { TAuthHandler } from '#/auth/domain/auth-handler.ts';
import { HTTP_METHOD } from '@app/contract';
import { ROUTE_PREFIX } from '#/platform/http/route-paths.ts';

export const authMount = (
  app: Hono,
  authGet: () => Promise<TAuthHandler>
): void => {
  app.on(
    [HTTP_METHOD.GET, HTTP_METHOD.POST],
    `${ROUTE_PREFIX.AUTH}/*`,
    async (context) => (await authGet()).handler(context.req.raw)
  );
};
