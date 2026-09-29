import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TRoadmapItem = TClientOutputs['roadmap']['get'];
export type TRoadmapStatus = TRoadmapItem['status'];

export const useRoadmapList = (input: TClientInputs['roadmap']['list']) =>
  useQuery(
    orpc.roadmap.list.queryOptions({ input, placeholderData: keepPreviousData })
  );

export const useRoadmap = (id: string) =>
  useQuery(orpc.roadmap.get.queryOptions({ input: { id }, retry: false }));

export const useRoadmapCreate = () => {
  const invalidate = useInvalidate(orpc.roadmap.key());
  return useMutation(
    orpc.roadmap.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRoadmapUpdate = () => {
  const invalidate = useInvalidate(orpc.roadmap.key());
  return useMutation(
    orpc.roadmap.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRoadmapRemove = () => {
  const invalidate = useInvalidate(orpc.roadmap.key());
  return useMutation(
    orpc.roadmap.remove.mutationOptions({ onSuccess: invalidate })
  );
};
