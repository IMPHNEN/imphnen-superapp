const RESOURCE = {
  USERS: '/users',
  ROLES: '/roles',
} as const;

export const ROUTE_PATH = {
  HEALTH: '/health',
  HEALTHZ: '/healthz',
  READY: '/ready',
  METRICS: '/metrics',
  ME: '/me',
  PERMISSIONS: '/permissions',
  ACTIVITY: '/activity',
  USERS: RESOURCE.USERS,
  USER: `${RESOURCE.USERS}/{id}`,
  USER_PASSWORD: `${RESOURCE.USERS}/{id}/password`,
  ROLES: RESOURCE.ROLES,
  ROLE: `${RESOURCE.ROLES}/{key}`,
} as const;
export type TRoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH];
