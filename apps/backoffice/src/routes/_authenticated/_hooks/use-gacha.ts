import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TGachaItem = TClientOutputs['gacha']['item']['get'];
export type TGachaClaim =
  TClientOutputs['gacha']['claim']['list']['items'][number];

export const useGachaItemList = (
  input: TClientInputs['gacha']['item']['list']
) =>
  useQuery(
    orpc.gacha.item.list.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useGachaItem = (id: string) =>
  useQuery(orpc.gacha.item.get.queryOptions({ input: { id }, retry: false }));

export const useGachaItemCreate = () => {
  const invalidate = useInvalidate(orpc.gacha.item.key());
  return useMutation(
    orpc.gacha.item.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useGachaItemUpdate = () => {
  const invalidate = useInvalidate(orpc.gacha.item.key());
  return useMutation(
    orpc.gacha.item.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useGachaItemRemove = () => {
  const invalidate = useInvalidate(orpc.gacha.item.key());
  return useMutation(
    orpc.gacha.item.remove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useGachaClaimList = (
  input: TClientInputs['gacha']['claim']['list'],
  enabled = true
) =>
  useQuery(
    orpc.gacha.claim.list.queryOptions({
      input,
      enabled,
      placeholderData: keepPreviousData,
    })
  );

export const useGachaClaimFulfil = () => {
  const invalidate = useInvalidate(orpc.gacha.claim.key());
  return useMutation(
    orpc.gacha.claim.fulfil.mutationOptions({ onSuccess: invalidate })
  );
};

export const useGachaCreditGrant = () =>
  useMutation(orpc.gacha.credit.grant.mutationOptions());
