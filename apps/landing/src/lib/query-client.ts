import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = 30_000;

let browserClient: QueryClient | undefined;

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

/**
 * Every Astro island is its own React root, so they cannot share a provider.
 * In the browser they share this one client instead, which lets the navbar,
 * the roadmap and the testimonial form read the same cached session.
 * On the server (static build) every render gets a fresh client.
 */
export const queryClientGet = (): QueryClient => {
  if (typeof window === 'undefined') return createQueryClient();
  browserClient ??= createQueryClient();
  return browserClient;
};
