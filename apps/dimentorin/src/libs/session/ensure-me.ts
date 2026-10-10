import {
  client,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { SESSION_QUERY_KEY } from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';

export type TMe = NonNullable<TClientOutputs['me']['get']>;

const SESSION_STALE_TIME = 60_000;
const UNAUTHORIZED = 'UNAUTHORIZED';

const isUnauthorized = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === UNAUTHORIZED;

const meOrNull = async (): Promise<TMe | null> => {
  try {
    return await client.me.get();
  } catch (error) {
    if (isUnauthorized(error)) return null;
    throw error;
  }
};

/**
 * Resolves the current session for route guards (`beforeLoad`). Shares the
 * query key with `useCurrentUser`, so the result is reused by components.
 * Any failure other than "not signed in" resolves to `null` as well: a guard
 * must not hang on a broken API.
 */
export const ensureMe = async (): Promise<TMe | null> => {
  try {
    return await queryClient.fetchQuery({
      queryKey: SESSION_QUERY_KEY,
      queryFn: meOrNull,
      staleTime: SESSION_STALE_TIME,
    });
  } catch {
    return null;
  }
};
