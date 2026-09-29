import { type QueryKey, useQueryClient } from '@tanstack/react-query';

export const useInvalidate = (
  ...queryKeys: QueryKey[]
): (() => Promise<void>) => {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all(
      queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );
  };
};
