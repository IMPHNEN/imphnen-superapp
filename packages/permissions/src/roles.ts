import { A, D } from '@mobily/ts-belt';
import { ALL_PERMISSIONS, type TPermission } from './permissions.ts';

export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type TRole = (typeof ROLE)[keyof typeof ROLE];

export const isRole = (value: string): value is TRole =>
  A.some(D.values(ROLE), (role) => role === value);

export const ROLE_PERMISSIONS: Record<TRole, readonly TPermission[]> = {
  [ROLE.SUPERADMIN]: ALL_PERMISSIONS,
  [ROLE.ADMIN]: ALL_PERMISSIONS,
  [ROLE.MEMBER]: [],
  [ROLE.VIEWER]: [],
};

export const permissionsForRole = (role: TRole): readonly TPermission[] =>
  D.get(ROLE_PERMISSIONS, role) ?? [];
