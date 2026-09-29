import type { Effect } from 'effect';
import type { EAuth, EDatabase } from '#/shared/errors.ts';
import type { TSession } from '#/shared/session.ts';

export type TAuthService = {
  getSession: (
    headers: Headers
  ) => Effect.Effect<TSession | null, EAuth | EDatabase>;
};
