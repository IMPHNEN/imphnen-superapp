import { PERMISSION as P, type TPermission } from '@app/permissions';

export type TLegacyPermission = {
  readonly name: string;
  readonly id: string;
  readonly keys: readonly TPermission[];
};

export const ADMINISTRATOR = {
  name: 'Administrator',
  id: 'd6e7f8a9-0123-4567-8901-6789012345ab',
} as const;

const entry = (
  name: string,
  id: string,
  keys: readonly TPermission[]
): TLegacyPermission => ({ name, id, keys });

const USER_ALL = [
  P.USER_CREATE,
  P.USER_READ,
  P.USER_UPDATE,
  P.USER_DELETE,
  P.USER_ACTIVATE,
];
const ROLE_ALL = [P.ROLE_CREATE, P.ROLE_READ, P.ROLE_UPDATE, P.ROLE_DELETE];

export const LEGACY_PERMISSIONS: readonly TLegacyPermission[] = [
  entry('Read List Users', '7c15e31d-36e2-49f9-97db-138c03fb0cf6', [
    P.USER_READ,
  ]),
  entry('Read Detail Users', '319ee593-ff0a-4f29-bbaf-9feb3174a3a6', [
    P.USER_READ,
  ]),
  entry('Create Users', '023e2dfe-93c3-4008-94a8-b5dff403f73b', [
    P.USER_CREATE,
  ]),
  entry('Delete Users', '96df0689-2ae9-4894-bf00-837c19415e5c', [
    P.USER_DELETE,
  ]),
  entry('Update Users', '98b3dc4c-0124-461f-afcd-166637c5e6e8', [
    P.USER_UPDATE,
  ]),
  entry('Activate Users', '4da8b434-89f9-4d91-85ae-eebd63cdbeda', [
    P.USER_ACTIVATE,
  ]),
  entry('Read List Roles', '9164ca6e-c7e3-4238-a15f-f36ab9577e7e', [
    P.ROLE_READ,
  ]),
  entry('Read Detail Roles', '73888d18-b3e9-4f62-95a5-ba2c0d69fccb', [
    P.ROLE_READ,
  ]),
  entry('Create Roles', '319ee593-ff0a-4f29-bbaf-9feb3174a3a2', [
    P.ROLE_CREATE,
  ]),
  entry('Delete Roles', '35b0d992-65c8-4b62-b030-e6e0320e4048', [
    P.ROLE_DELETE,
  ]),
  entry('Update Roles', 'a00d5608-4c48-4542-845c-dfe004687022', [
    P.ROLE_UPDATE,
  ]),
  entry('Read List Permissions', '8195eeb8-e64f-4172-aa57-596492c84a72', [
    P.ROLE_READ,
  ]),
  entry('Read Detail Permissions', 'dad435cf-042c-41bd-a946-cea61ed2ffbc', [
    P.ROLE_READ,
  ]),
  entry('Create Permissions', '0269ed71-0ae0-4c43-ad29-e3d861d8f9a0', []),
  entry('Delete Permissions', 'b2dc3928-86ba-4c59-a03d-0b57d5183ebc', []),
  entry('Update Permissions', '299cb4d5-6556-4cc9-b6c1-32e6d31e0f9b', []),
  entry('Manage All Users', 'd0e1f2a3-4567-8901-2345-0123456789ab', USER_ALL),
  entry('Manage All Roles', 'e1f2a3b4-5678-9012-3456-1234567890ab', ROLE_ALL),
  entry('Manage All Permissions', 'f2a3b4c5-6789-0123-4567-2345678901ab', [
    P.ROLE_READ,
  ]),
  entry('View All Sensitive Data', 'b4c5d6e7-8901-2345-6789-4567890123ab', []),
  entry('Access Admin Dashboard', 'c5d6e7f8-9012-3456-7890-5678901234ab', []),
  entry('Create Gacha Claims', 'f41d53ce-4f88-4bb6-b9b4-5e3a8c38d962', [
    P.GACHA_ROLL,
  ]),
  entry('Read Detail Gacha Claims', 'c1c3d6c2-19fb-4b70-b58c-c19f2e8cfc79', [
    P.GACHA_CLAIM_READ,
  ]),
  entry('Read List Gacha Items', 'fa6eb842-0a61-40c2-9c24-b226ad975037', [
    P.GACHA_ITEM_READ,
  ]),
  entry('Read Detail Gacha Items', '9c7857d7-b5ae-4688-923d-ef5572e9bc8b', [
    P.GACHA_ITEM_READ,
  ]),
  entry('Create Gacha Items', 'cf063be1-4d71-489e-b9fb-1c08c65f396c', [
    P.GACHA_ITEM_CREATE,
  ]),
  entry('Delete Gacha Items', '46f8c6cf-ea0c-4c90-860c-69e2e65f7eb1', [
    P.GACHA_ITEM_DELETE,
  ]),
  entry('Update Gacha Items', '2d0cf4ae-56ae-4714-a12e-655cfc3d9eb2', [
    P.GACHA_ITEM_UPDATE,
  ]),
  entry('Read Detail Gacha Rolls', '53d6483a-04cd-4667-8792-2d0cc8e2d343', [
    P.GACHA_ROLL,
  ]),
  entry('Create Gacha Rolls', '18e36c63-fcb7-4877-b911-c5aa611e878f', [
    P.GACHA_ROLL,
  ]),
  entry('Execute Gacha Rolls', '14c6a1cd-5c63-4643-89b5-b1a5f9920cc0', [
    P.GACHA_ROLL,
  ]),
  entry('Delete Gacha Rolls', '12345678-ABCD-EFAB-CDEF-0123456789AB', []),
  entry('Read List Mentors', 'a1b2c3d4-5e6f-7890-abcd-ef1234567890', [
    P.MENTOR_READ,
  ]),
  entry('Read Detail Mentors', 'b2c3d4e5-6f78-9012-bcde-f23456789012', [
    P.MENTOR_READ,
  ]),
  entry('Register Mentors', 'c3d4e5f6-7890-1234-cdef-345678901234', [
    P.MENTOR_REGISTER,
  ]),
  entry('Read Own Mentor Profile', 'd4e5f6a7-8901-2345-def0-456789012345', [
    P.MENTOR_PROFILE_READ,
  ]),
  entry('Update Own Mentor Profile', 'e5f6a7b8-9012-3456-ef01-567890123456', [
    P.MENTOR_PROFILE_UPDATE,
  ]),
  entry('Read Own Mentor Status', 'f6a7b8c9-0123-4567-f012-678901234567', [
    P.MENTOR_PROFILE_READ,
  ]),
  entry('Update Mentors', 'a7b8c9d0-1234-5678-0123-789012345678', [
    P.MENTOR_UPDATE,
  ]),
  entry('Verify Mentors', 'b8c9d0e1-2345-6789-1234-890123456789', [
    P.MENTOR_VERIFY,
  ]),
  entry('Delete Mentors', 'c9d0e1f2-3456-7890-2345-901234567890', [
    P.MENTOR_DELETE,
  ]),
];
