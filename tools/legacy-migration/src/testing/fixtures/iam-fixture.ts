import type { TLegacyRole } from '../../legacy/legacy-rows.ts';
import { fixtureId, T0, T1 } from '../fixture-builders.ts';

export const ROLE_ID = {
  ADMIN: 'f6b03f25-e416-4893-ac88-caaa690afb07',
  MENTOR: '3b9f8c4e-6a2d-4f8a-9a12-2d6f8b3c4e5a',
  USER: '5713cb37-dc02-4e87-8048-d7a41d352059',
  STAF: '50133429-f4b1-4249-9f97-7b86e6ee9d86',
  CONTENT: fixtureId(201),
  OPS: fixtureId(202),
  RETIRED: fixtureId(203),
  CLASH: fixtureId(204),
} as const;

export const USER_ID = {
  ADMIN: fixtureId(101),
  STAF: fixtureId(102),
  MENTOR: fixtureId(103),
  FORMER_MENTOR: fixtureId(104),
  UNVERIFIED: fixtureId(105),
  DISABLED: fixtureId(106),
  DELETED: fixtureId(107),
  BROKEN_JSON: fixtureId(108),
  WRONG_SHAPE: fixtureId(109),
  CONTENT: fixtureId(110),
  OPS: fixtureId(111),
  RETIRED_ROLE: fixtureId(112),
  NO_PASSWORD: fixtureId(113),
  MENTEE: fixtureId(114),
  QR_ADMIN: fixtureId(115),
  SARI: fixtureId(116),
  RENAMED: fixtureId(117),
  APPLICANT: fixtureId(118),
} as const;

const legacyRole = (
  partial: Partial<TLegacyRole> & Pick<TLegacyRole, 'id' | 'name'>
): TLegacyRole => ({
  description: 'System generated role',
  permissions: '[]',
  created_at: T0,
  deleted_at: null,
  ...partial,
  updated_at: partial.updated_at ?? partial.created_at ?? T0,
});

export const IAM_ROLES: readonly TLegacyRole[] = [
  legacyRole({
    id: ROLE_ID.ADMIN,
    name: 'Admin',
    permissions: '["d6e7f8a9-0123-4567-8901-6789012345ab"]',
  }),
  legacyRole({ id: ROLE_ID.MENTOR, name: 'Mentor' }),
  legacyRole({
    id: ROLE_ID.USER,
    name: 'User',
    permissions:
      '["fa6eb842-0a61-40c2-9c24-b226ad975037","7c15e31d-36e2-49f9-97db-138c03fb0cf6"]',
  }),
  legacyRole({
    id: ROLE_ID.STAF,
    name: 'Staf',
    permissions: '["9164ca6e-c7e3-4238-a15f-f36ab9577e7e"]',
  }),
  legacyRole({
    id: ROLE_ID.CONTENT,
    name: 'Tim Kontén & Acara',
    description: '',
    permissions:
      '["Read List Users","Create Gacha Items","cf063be1-4d71-489e-b9fb-1c08c65f396c","Bogus Permission",42]',
    created_at: T1,
  }),
  legacyRole({
    id: ROLE_ID.OPS,
    name: 'Super Ops',
    permissions: '["Administrator"]',
    created_at: T1,
  }),
  legacyRole({
    id: ROLE_ID.RETIRED,
    name: 'Old Role',
    permissions: '["Create Users"]',
    deleted_at: T1,
  }),
  legacyRole({
    id: ROLE_ID.CLASH,
    name: 'staf',
    description: 'api created',
    permissions: 'null',
    created_at: T1,
  }),
];
