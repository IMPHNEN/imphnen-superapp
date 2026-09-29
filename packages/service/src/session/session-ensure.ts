import type { TMe } from '@app/schemas';
import type { QueryClient } from '@tanstack/react-query';
import { SESSION_QUERY_KEY } from './session-keys';
import { meOrNull } from './use-current-user';

const SESSION_STALE_TIME = 60_000;

export const sessionEnsure = async (
  queryClient: QueryClient
): Promise<TMe | null> => {
  try {
    return await queryClient.fetchQuery({
      queryKey: SESSION_QUERY_KEY,
      queryFn: meOrNull,
      staleTime: SESSION_STALE_TIME,
    });
  } catch {
    return null;
  }
};
