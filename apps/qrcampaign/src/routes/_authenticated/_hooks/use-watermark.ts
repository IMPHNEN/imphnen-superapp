import {
  orpc,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { useMutation, useQuery } from '@tanstack/react-query';

export type TActiveCampaign = TClientOutputs['qr']['activeCampaign'];

export const useActiveCampaign = () =>
  useQuery({
    ...orpc.qr.activeCampaign.queryOptions(),
    retry: false,
    staleTime: 60_000,
  });

export const useWatermark = () =>
  useMutation(orpc.qr.watermark.mutationOptions());
