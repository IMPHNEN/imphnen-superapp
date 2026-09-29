import type { TAppRouterClient } from '@app/contract';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { apiBaseUrl } from './api-base-url';

const RPC_PATH = '/rpc';

const link = new RPCLink({
  url: (): string => `${apiBaseUrl()}${RPC_PATH}`,
  fetch: (input, init): Promise<Response> =>
    fetch(input, { ...init, credentials: 'include' }),
});

export const client: TAppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
