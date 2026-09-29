import { Effect } from 'effect';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { match, P } from 'ts-pattern';
import { runtime } from '#/bootstrap/compose.ts';
import { routerBuild } from '#/bootstrap/router.ts';
import { AuthService } from '#/auth/infrastructure/auth-service.ts';
import type { TAuth } from '#/auth/infrastructure/better-auth.ts';
import { authMount } from '#/auth/presentation/mount-auth.ts';
import { healthModule, healthMount } from '#/health/index.ts';
import { env } from '#/platform/config/env.ts';
import { apiReferenceEnabledOf } from '#/platform/config/env-schema.ts';
import { bodyLimitMount } from '#/platform/http/mount-body-limit.ts';
import { orpcMount } from '#/platform/http/mount-orpc.ts';
import { originMatcherOf, originsOf } from '#/platform/http/origins.ts';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import {
  SESSION_STATE,
  type TSession,
  type TSessionState,
} from '#/shared/session.ts';

type TSessionResolution = {
  session: TSession | null;
  sessionState: TSessionState;
};

const SESSION_UNAVAILABLE: TSessionResolution = {
  session: null,
  sessionState: SESSION_STATE.UNAVAILABLE,
};

const sessionResolutionOf = (session: TSession | null): TSessionResolution =>
  match(session)
    .with(
      P.nullish,
      (): TSessionResolution => ({
        session: null,
        sessionState: SESSION_STATE.ANONYMOUS,
      })
    )
    .otherwise(
      (found): TSessionResolution => ({
        session: found,
        sessionState: SESSION_STATE.RESOLVED,
      })
    );

const sessionResolve = (headers: Headers): Promise<TSessionResolution> =>
  runtime.runPromise(
    AuthService.use((service) => service.getSession(headers)).pipe(
      Effect.map(sessionResolutionOf),
      Effect.catch((cause): Effect.Effect<TSessionResolution> => {
        console.error(
          JSON.stringify({
            msg: 'session.resolve.failed',
            cause: String(cause),
          })
        );
        return Effect.succeed(SESSION_UNAVAILABLE);
      })
    )
  );

const buildContext = async (headers: Headers): Promise<TORPCContext> => {
  const resolution = await sessionResolve(headers);

  return {
    headers,
    session: resolution.session,
    sessionState: resolution.sessionState,
    permissions: resolution.session?.permissions ?? [],
    runtime,
  };
};

const authGet = (): Promise<TAuth> =>
  runtime.runPromise(
    AuthService.use((service) => Effect.succeed(service.auth))
  );

const logger = {
  error: (data: Record<string, unknown>, msg: string): void => {
    console.error(JSON.stringify({ msg, error: String(data.err) }));
  },
};

const app = new Hono();

app.use('*', requestId());

app.use('*', async (context, next) => {
  const originAllowed = originMatcherOf(
    originsOf(env.WEB_ORIGIN, env.AUTH_TRUSTED_ORIGINS)
  );
  return cors({
    origin: (origin): string | null => (originAllowed(origin) ? origin : null),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(context, next);
});

bodyLimitMount(app);

healthMount(app, {
  readiness: () => runtime.runPromise(healthModule.readiness()),
});
authMount(app, authGet);
orpcMount({
  app,
  router: routerBuild(),
  logger,
  referenceEnabledGet: () => apiReferenceEnabledOf(env),
  buildContext,
});

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
