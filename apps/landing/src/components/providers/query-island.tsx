import { QueryClientProvider } from '@tanstack/react-query';
import { type ComponentType, type ReactElement, useState } from 'react';
import { queryClientGet } from '@/lib/query-client';

/**
 * Wraps an Astro island in a QueryClientProvider. Use it on every island that
 * calls TanStack Query or the session hooks:
 * `export default withQueryClient(MyIsland);`
 */
export const withQueryClient = <TProps extends object>(
  Island: ComponentType<TProps>
): ComponentType<TProps> => {
  const WithQueryClient = (props: TProps): ReactElement => {
    const [client] = useState(queryClientGet);
    return (
      <QueryClientProvider client={client}>
        <Island {...props} />
      </QueryClientProvider>
    );
  };
  WithQueryClient.displayName = `withQueryClient(${Island.displayName ?? Island.name ?? 'Island'})`;
  return WithQueryClient;
};
