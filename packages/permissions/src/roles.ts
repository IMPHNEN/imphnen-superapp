import { A, D } from '@mobily/ts-belt';
import {
  ALL_PERMISSIONS,
  PERMISSION,
  type TPermission,
} from './permissions.ts';

export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MENTOR: 'mentor',
  USER: 'user',
} as const;

export type TRole = (typeof ROLE)[keyof typeof ROLE];

export const DEFAULT_ROLE: TRole = ROLE.USER;

export const isRole = (value: string): value is TRole =>
  A.some(D.values(ROLE), (role) => role === value);

const MEMBER_PERMISSIONS: readonly TPermission[] = [
  PERMISSION.GACHA_ITEM_READ,
  PERMISSION.GACHA_ROLL,
  PERMISSION.GACHA_CLAIM_READ,
  PERMISSION.GACHA_CREDIT_READ,
  PERMISSION.MENTOR_READ,
  PERMISSION.MENTOR_REGISTER,
  PERMISSION.MENTORING_SESSION_READ,
  PERMISSION.MENTORING_SESSION_CREATE,
  PERMISSION.TESTIMONIAL_CREATE,
  PERMISSION.ROADMAP_VOTE,
  PERMISSION.HACKATHON_PARTICIPATE,
];

export const ROLE_PERMISSIONS: Record<TRole, readonly TPermission[]> = {
  [ROLE.SUPERADMIN]: ALL_PERMISSIONS,
  [ROLE.ADMIN]: ALL_PERMISSIONS,
  [ROLE.MENTOR]: [
    ...MEMBER_PERMISSIONS,
    PERMISSION.MENTOR_PROFILE_READ,
    PERMISSION.MENTOR_PROFILE_UPDATE,
    PERMISSION.MENTORING_SESSION_UPDATE,
  ],
  [ROLE.USER]: MEMBER_PERMISSIONS,
};

export const permissionsForRole = (role: TRole): readonly TPermission[] =>
  D.get(ROLE_PERMISSIONS, role) ?? [];
