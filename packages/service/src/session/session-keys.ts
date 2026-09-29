import { orpc } from '../rpc/client';

export const SESSION_QUERY_KEY = orpc.me.get.queryKey();

export const SESSION_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const;

export type TSessionStatus =
  (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
