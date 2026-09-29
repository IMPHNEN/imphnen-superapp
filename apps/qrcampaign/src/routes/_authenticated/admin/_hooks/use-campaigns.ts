import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export type TCampaign = TClientOutputs['qr']['campaignList']['items'][number];
export type TCampaignListInput = TClientInputs['qr']['campaignList'];
export type TCampaignCreateInput = TClientInputs['qr']['campaignCreate'];

export const useCampaignList = (input: TCampaignListInput) =>
  useQuery({
    ...orpc.qr.campaignList.queryOptions({ input }),
    placeholderData: keepPreviousData,
  });

const useInvalidateQr = (): (() => Promise<void>) => {
  const queryClient = useQueryClient();
  return (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: orpc.qr.key() });
};

export const useCreateCampaign = () => {
  const invalidate = useInvalidateQr();
  return useMutation(
    orpc.qr.campaignCreate.mutationOptions({ onSuccess: invalidate })
  );
};

export const useActivateCampaign = () => {
  const invalidate = useInvalidateQr();
  return useMutation(
    orpc.qr.campaignActivate.mutationOptions({ onSuccess: invalidate })
  );
};

export const useRemoveCampaign = () => {
  const invalidate = useInvalidateQr();
  return useMutation(
    orpc.qr.campaignRemove.mutationOptions({ onSuccess: invalidate })
  );
};
