import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TEventItem = TClientOutputs['event']['get'];
export type TEventWriteInput = TClientInputs['event']['create'];

export const useEventList = (input: TClientInputs['event']['list']) =>
  useQuery(
    orpc.event.list.queryOptions({ input, placeholderData: keepPreviousData })
  );

export const useEvent = (id: string) =>
  useQuery(orpc.event.get.queryOptions({ input: { id }, retry: false }));

export const useEventCreate = () => {
  const invalidate = useInvalidate(orpc.event.key());
  return useMutation(
    orpc.event.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useEventUpdate = () => {
  const invalidate = useInvalidate(orpc.event.key());
  return useMutation(
    orpc.event.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useEventRemove = () => {
  const invalidate = useInvalidate(orpc.event.key());
  return useMutation(
    orpc.event.remove.mutationOptions({ onSuccess: invalidate })
  );
};
