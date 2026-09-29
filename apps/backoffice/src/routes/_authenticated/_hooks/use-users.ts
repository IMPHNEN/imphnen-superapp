import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TUserItem = TClientOutputs['user']['get'];
export type TUserListInput = TClientInputs['user']['list'];

export const useUserList = (input: TUserListInput, enabled = true) =>
  useQuery(
    orpc.user.list.queryOptions({
      input,
      enabled,
      placeholderData: keepPreviousData,
    })
  );

export const useUser = (id: string | undefined) =>
  useQuery(
    orpc.user.get.queryOptions({
      input: { id: id ?? '' },
      enabled: !!id,
      retry: false,
    })
  );

export const useUserCreate = () => {
  const invalidate = useInvalidate(orpc.user.key());
  return useMutation(
    orpc.user.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useUserUpdate = () => {
  const invalidate = useInvalidate(orpc.user.key());
  return useMutation(
    orpc.user.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useUserSetActive = () => {
  const invalidate = useInvalidate(orpc.user.key());
  return useMutation(
    orpc.user.setActive.mutationOptions({ onSuccess: invalidate })
  );
};

export const useUserRemove = () => {
  const invalidate = useInvalidate(orpc.user.key());
  return useMutation(
    orpc.user.remove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useUserResetPassword = () =>
  useMutation(orpc.user.resetPassword.mutationOptions());
