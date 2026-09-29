import type { TGachaClaim, TGachaItem, TGachaRollResult } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { ORPCError } from '@orpc/client';
import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const CATALOGUE_PAGE_SIZE = 10;
const PRIZES_PAGE_SIZE = 50;

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
} as const;

export const ROLL_ERROR_MESSAGE = {
  NOT_ENOUGH_CREDITS: 'Kamu tidak punya gacha roll. Beli dulu ya!',
  SOLD_OUT: 'Hadiah sudah habis. Coba lagi nanti ya!',
  UNKNOWN: 'Gagal spin gacha. Coba lagi ya!',
} as const;

export const rollErrorMessage = (error: unknown): string => {
  if (!(error instanceof ORPCError)) return ROLL_ERROR_MESSAGE.UNKNOWN;
  if (error.status === HTTP_STATUS.BAD_REQUEST)
    return ROLL_ERROR_MESSAGE.NOT_ENOUGH_CREDITS;
  if (error.status === HTTP_STATUS.CONFLICT) return ROLL_ERROR_MESSAGE.SOLD_OUT;
  return ROLL_ERROR_MESSAGE.UNKNOWN;
};

/** The catalogue is not public: it needs a session (`gacha-item:read`). */
export const useGachaItems = (): readonly TGachaItem[] => {
  const { isAuthenticated } = useCurrentUser();
  const { data } = useQuery({
    ...orpc.gacha.item.list.queryOptions({
      input: { pageSize: CATALOGUE_PAGE_SIZE },
    }),
    enabled: isAuthenticated,
  });
  return data?.items ?? [];
};

/** `undefined` while signed out or loading. */
export const useGachaBalance = (): number | undefined => {
  const { isAuthenticated } = useCurrentUser();
  const { data } = useQuery({
    ...orpc.gacha.credit.mine.queryOptions(),
    enabled: isAuthenticated,
  });
  return data?.balance;
};

export const useMyPrizes = (): readonly TGachaClaim[] => {
  const { isAuthenticated } = useCurrentUser();
  const { data } = useQuery({
    ...orpc.gacha.claim.mine.queryOptions({
      input: { pageSize: PRIZES_PAGE_SIZE },
    }),
    enabled: isAuthenticated,
  });
  return data?.items ?? [];
};

export const useGachaRoll = (): UseMutationResult<
  TGachaRollResult,
  Error,
  unknown
> => {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.gacha.roll.execute.mutationOptions(),
    onSuccess: (result): Promise<void> => {
      queryClient.setQueryData(
        orpc.gacha.credit.mine.queryKey(),
        (previous) => previous && { ...previous, balance: result.balance }
      );
      return queryClient.invalidateQueries({ queryKey: orpc.gacha.key() });
    },
    onError: (): Promise<void> =>
      queryClient.invalidateQueries({ queryKey: orpc.gacha.credit.key() }),
  });
};
