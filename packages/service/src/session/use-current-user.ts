'use client';

import type { TPermission } from '@app/permissions';
import type { TMe } from '@app/schemas';
import { ORPCError } from '@orpc/client';
import { useQuery } from '@tanstack/react-query';
import { client } from '../rpc/client';
import {
  SESSION_QUERY_KEY,
  SESSION_STATUS,
  type TSessionStatus,
} from './session-keys';

const UNAUTHORIZED = 'UNAUTHORIZED';

export type TCurrentUser = {
  me: TMe | null;
  status: TSessionStatus;
  isAuthenticated: boolean;
  can: (...required: TPermission[]) => boolean;
};

const meOrNull = async (): Promise<TMe | null> => {
  try {
    return await client.me.get();
  } catch (error) {
    if (error instanceof ORPCError && error.code === UNAUTHORIZED) return null;
    throw error;
  }
};

export const useCurrentUser = (): TCurrentUser => {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: meOrNull,
    staleTime: 60_000,
    retry: false,
  });
  const me = query.data ?? null;
  const status: TSessionStatus = query.isPending
    ? SESSION_STATUS.LOADING
    : me
      ? SESSION_STATUS.AUTHENTICATED
      : SESSION_STATUS.UNAUTHENTICATED;

  return {
    me,
    status,
    isAuthenticated: status === SESSION_STATUS.AUTHENTICATED,
    can: (...required: TPermission[]): boolean =>
      me !== null &&
      required.every((permission) => me.permissions.includes(permission)),
  };
};
