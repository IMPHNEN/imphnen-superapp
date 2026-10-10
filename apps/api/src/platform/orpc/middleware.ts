import { AUTH_MESSAGE } from '@app/messages';
import { canAll, type TPermission } from '@app/permissions';
import { ORPCError, os } from '@orpc/server';
import { match, P } from 'ts-pattern';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import { SESSION_STATE } from '#/shared/session.ts';
import { toORPCError } from '#/platform/orpc/error-mapping.ts';

const base = os.$context<TORPCContext>();

export const errorMapped = base.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    throw toORPCError(error);
  }
});

export const sessionAvailable = base.middleware(async ({ context, next }) =>
  match(context.sessionState)
    .with(SESSION_STATE.UNAVAILABLE, () => {
      throw new ORPCError('SERVICE_UNAVAILABLE', {
        message: AUTH_MESSAGE.SESSION_UNAVAILABLE,
      });
    })
    .with(SESSION_STATE.RESOLVED, SESSION_STATE.ANONYMOUS, () => next())
    .exhaustive()
);

export const sessionRequired = base.middleware(async ({ context, next }) =>
  match({ state: context.sessionState, session: context.session })
    .with({ state: SESSION_STATE.UNAVAILABLE }, () => {
      throw new ORPCError('SERVICE_UNAVAILABLE', {
        message: AUTH_MESSAGE.SESSION_UNAVAILABLE,
      });
    })
    .with({ session: P.nullish }, () => {
      throw new ORPCError('UNAUTHORIZED', {
        message: AUTH_MESSAGE.UNAUTHORIZED,
      });
    })
    .with({ session: P.nonNullable }, ({ session }) =>
      next({ context: { session } })
    )
    .exhaustive()
);

type TSessionGuard = typeof sessionRequired;

export const permissionRequire = (...required: TPermission[]): TSessionGuard =>
  sessionRequired.concat<Record<never, never>, unknown>(
    async ({ context, next }) =>
      match(canAll(context.permissions, required))
        .with(false, () => {
          throw new ORPCError('FORBIDDEN', { message: AUTH_MESSAGE.FORBIDDEN });
        })
        .otherwise(() => next())
  );
