import {
  PERMISSION,
  ROLE,
  type TPermission,
  type TRole,
} from '@app/permissions';

export const SEEDED_ROLE_KIND = {
  FIXED: 'fixed',
  CUSTOM: 'custom',
} as const;

export type TSeededRole =
  | { readonly kind: typeof SEEDED_ROLE_KIND.FIXED; readonly role: TRole }
  | {
      readonly kind: typeof SEEDED_ROLE_KIND.CUSTOM;
      readonly key: string;
      readonly label: string;
      readonly permissions: readonly TPermission[];
    };

export const SEEDED_ROLES: ReadonlyMap<string, TSeededRole> = new Map<
  string,
  TSeededRole
>([
  [
    'f6b03f25-e416-4893-ac88-caaa690afb07',
    { kind: SEEDED_ROLE_KIND.FIXED, role: ROLE.ADMIN },
  ],
  [
    '3b9f8c4e-6a2d-4f8a-9a12-2d6f8b3c4e5a',
    { kind: SEEDED_ROLE_KIND.FIXED, role: ROLE.MENTOR },
  ],
  [
    '5713cb37-dc02-4e87-8048-d7a41d352059',
    { kind: SEEDED_ROLE_KIND.FIXED, role: ROLE.USER },
  ],
  [
    '50133429-f4b1-4249-9f97-7b86e6ee9d86',
    {
      kind: SEEDED_ROLE_KIND.CUSTOM,
      key: 'staf',
      label: 'Staf',
      permissions: [
        PERMISSION.USER_READ,
        PERMISSION.USER_ACTIVATE,
        PERMISSION.ROLE_READ,
        PERMISSION.MENTOR_READ,
        PERMISSION.GACHA_ITEM_READ,
        PERMISSION.GACHA_ROLL,
      ],
    },
  ],
  [
    '60f1aeb7-dad2-4e06-bcb5-be1ba510c906',
    {
      kind: SEEDED_ROLE_KIND.CUSTOM,
      key: 'staff-aktivasi-user',
      label: 'Staff Aktivasi User',
      permissions: [PERMISSION.USER_ACTIVATE],
    },
  ],
  [
    '6d4fea5d-4a08-4b8a-9782-f2ab2183dcf0',
    {
      kind: SEEDED_ROLE_KIND.CUSTOM,
      key: 'admin-pembayaran',
      label: 'Admin Pembayaran',
      permissions: [],
    },
  ],
]);

export const NAMED_FIXED_ROLES: ReadonlyMap<string, TRole> = new Map([
  ['Admin', ROLE.ADMIN],
  ['Mentor', ROLE.MENTOR],
  ['User', ROLE.USER],
]);
