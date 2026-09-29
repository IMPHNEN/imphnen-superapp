const OPENAPI_PREFIX = '/api';
const RPC_PREFIX = '/rpc';

export const ROUTE_PREFIX = {
  RPC: RPC_PREFIX,
  OPENAPI: OPENAPI_PREFIX,
  AUTH: `${OPENAPI_PREFIX}/auth`,
} as const;
