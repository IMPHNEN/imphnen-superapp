import { AUTH_MESSAGE } from '@app/messages';
import { PERMISSION, type TPermission } from '@app/permissions';
import { type ORPCError, call, os } from '@orpc/server';
import { describe, expect, it } from 'vitest';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import {
  permissionRequire,
  sessionRequired,
} from '#/platform/orpc/middleware.ts';
import {
  SESSION_STATE,
  type TSession,
  type TSessionState,
} from '#/shared/session.ts';

const SESSION: TSession = {
  user: { id: 'u1', email: 'a@b.test', name: 'A', role: 'admin', image: null },
  permissions: [],
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_SERVICE_UNAVAILABLE = 503;

const base = os.$context<TORPCContext>();
const sessionProcedure = base.use(sessionRequired);

const contextOf = (
  sessionState: TSessionState,
  session: TSession | null
): TORPCContext =>
  ({
    headers: new Headers(),
    session,
    sessionState,
    permissions: session?.permissions ?? [],
  }) as unknown as TORPCContext;

const callWith = (
  sessionState: TSessionState,
  session: TSession | null
): Promise<unknown> =>
  call(
    sessionProcedure.handler(() => 'ok'),
    undefined,
    {
      context: contextOf(sessionState, session),
    }
  );

const errorOf = async (
  sessionState: TSessionState,
  session: TSession | null
): Promise<ORPCError<string, unknown>> => {
  try {
    await callWith(sessionState, session);
  } catch (error) {
    return error as ORPCError<string, unknown>;
  }
  throw new Error('expected the procedure to reject');
};

describe('sessionRequired', () => {
  it('runs the handler for a resolved session', async (): Promise<void> => {
    expect(await callWith(SESSION_STATE.RESOLVED, SESSION)).toBe('ok');
  });

  it('hands the handler a session it can read without asserting on it', async (): Promise<void> => {
    const userId = await call(
      sessionProcedure.handler(({ context }) => context.session.user.id),
      undefined,
      { context: contextOf(SESSION_STATE.RESOLVED, SESSION) }
    );

    expect(userId).toBe(SESSION.user.id);
  });

  it('answers unauthorized when nobody is signed in', async (): Promise<void> => {
    const error = await errorOf(SESSION_STATE.ANONYMOUS, null);

    expect(error.status).toBe(HTTP_UNAUTHORIZED);
    expect(error.message).toBe(AUTH_MESSAGE.UNAUTHORIZED);
  });

  it('answers service unavailable when the session could not be checked at all', async (): Promise<void> => {
    const error = await errorOf(SESSION_STATE.UNAVAILABLE, null);

    expect(error.status).toBe(HTTP_SERVICE_UNAVAILABLE);
    expect(error.message).toBe(AUTH_MESSAGE.SESSION_UNAVAILABLE);
  });

  it('does not report an outage as being signed out', async (): Promise<void> => {
    const outage = await errorOf(SESSION_STATE.UNAVAILABLE, null);
    const anonymous = await errorOf(SESSION_STATE.ANONYMOUS, null);

    expect(outage.status).not.toBe(anonymous.status);
  });
});

describe('permissionRequire', () => {
  const guarded = base
    .use(permissionRequire(PERMISSION.USER_UPDATE))
    .handler(() => 'ok');

  const contextGranting = (permissions: readonly TPermission[]): TORPCContext =>
    ({
      ...contextOf(SESSION_STATE.RESOLVED, SESSION),
      permissions,
    }) as TORPCContext;

  const statusOf = (
    procedure: typeof guarded,
    context: TORPCContext
  ): Promise<number | undefined> =>
    call(procedure, undefined, { context }).then(
      (): undefined => undefined,
      (error: ORPCError<string, unknown>): number => error.status
    );

  it('runs the handler when the session holds the permission', async (): Promise<void> => {
    const result = await call(guarded, undefined, {
      context: contextGranting([PERMISSION.USER_UPDATE]),
    });

    expect(result).toBe('ok');
  });

  it('answers forbidden when the session lacks the permission', async (): Promise<void> => {
    expect(
      await statusOf(guarded, contextGranting([PERMISSION.USER_READ]))
    ).toBe(HTTP_FORBIDDEN);
  });

  it('requires every permission listed, not just one of them', async (): Promise<void> => {
    const both = base
      .use(permissionRequire(PERMISSION.USER_READ, PERMISSION.USER_UPDATE))
      .handler(() => 'ok');

    expect(await statusOf(both, contextGranting([PERMISSION.USER_READ]))).toBe(
      HTTP_FORBIDDEN
    );
  });

  it('checks the session before the permission', async (): Promise<void> => {
    expect(
      await statusOf(guarded, contextOf(SESSION_STATE.ANONYMOUS, null))
    ).toBe(HTTP_UNAUTHORIZED);
  });
});
