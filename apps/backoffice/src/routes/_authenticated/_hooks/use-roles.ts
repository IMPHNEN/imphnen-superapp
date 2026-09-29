import {
  orpc,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { SESSION_QUERY_KEY } from '@imphnen-frontend-service/service/session';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TRoleItem = TClientOutputs['role']['get'];
export type TPermissionItem =
  TClientOutputs['permission']['list']['items'][number];

export const useRoleList = (enabled = true) =>
  useQuery(orpc.role.list.queryOptions({ enabled }));

export const useRole = (key: string | undefined) =>
  useQuery(
    orpc.role.get.queryOptions({
      input: { key: key ?? '' },
      enabled: !!key,
      retry: false,
    })
  );

export const usePermissionList = () =>
  useQuery(orpc.permission.list.queryOptions({ staleTime: Infinity }));

export const useRoleCreate = () => {
  const invalidate = useInvalidate(orpc.role.key());
  return useMutation(
    orpc.role.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRoleUpdate = () => {
  const invalidate = useInvalidate(orpc.role.key(), SESSION_QUERY_KEY);
  return useMutation(
    orpc.role.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRoleRemove = () => {
  const invalidate = useInvalidate(orpc.role.key());
  return useMutation(
    orpc.role.remove.mutationOptions({ onSuccess: invalidate })
  );
};
