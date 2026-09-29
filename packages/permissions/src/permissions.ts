import { A, D } from '@mobily/ts-belt';

export const PERMISSION = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ACTIVITY_READ: 'activity:read',
} as const;

export type TPermission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ALL_PERMISSIONS: readonly TPermission[] = D.values(PERMISSION);

export const isPermission = (value: string): value is TPermission =>
  A.some(ALL_PERMISSIONS, (permission) => permission === value);
