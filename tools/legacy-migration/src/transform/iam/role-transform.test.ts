import { PERMISSION } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import type { TCustomRoleRow } from '../../target/target-rows.ts';
import { IAM_ROLES, ROLE_ID } from '../../testing/fixtures/iam-fixture.ts';
import { rolesTransform } from './role-transform.ts';

const transform = rolesTransform(IAM_ROLES);
const keyOf = (id: string): string | undefined => transform.roleKeyById.get(id);
const customRow = (key: string): TCustomRoleRow | undefined =>
  A.find(transform.customRoles, (row): boolean => row.key === key) ?? undefined;

describe('legacy roles', () => {
  it('maps the seeded Admin, Mentor and User roles to fixed roles', (): void => {
    expect(keyOf(ROLE_ID.ADMIN)).toBe('admin');
    expect(keyOf(ROLE_ID.MENTOR)).toBe('mentor');
    expect(keyOf(ROLE_ID.USER)).toBe('user');
  });

  it('writes the seeded Staf role with the permission set of the spec, not its stored ids', (): void => {
    expect(customRow('staf')).toMatchObject({
      id: ROLE_ID.STAF,
      label: 'Staf',
      description: null,
      permissions: JSON.stringify([
        PERMISSION.USER_READ,
        PERMISSION.USER_ACTIVATE,
        PERMISSION.ROLE_READ,
        PERMISSION.MENTOR_READ,
        PERMISSION.GACHA_ITEM_READ,
        PERMISSION.GACHA_ROLL,
      ]),
    });
  });

  it('resolves an API role that stores names and ids, and logs the rest', (): void => {
    expect(customRow('tim-konten-acara')?.permissions).toBe(
      JSON.stringify([PERMISSION.USER_READ, PERMISSION.GACHA_ITEM_CREATE])
    );
    expect(customRow('tim-konten-acara')?.description).toBeNull();
    const unmapped = A.filter(
      transform.adjustments,
      (item): boolean =>
        item.id === ROLE_ID.CONTENT && item.rule === 'permission-unmapped'
    );
    expect(A.map(unmapped, (item): string => item.detail)).toEqual([
      'Bogus Permission',
      '42',
    ]);
  });

  it('turns a role holding Administrator into the fixed admin role', (): void => {
    expect(keyOf(ROLE_ID.OPS)).toBe('admin');
    expect(customRow('super-ops')).toBeUndefined();
  });

  it('skips soft-deleted roles so their users fall back to user', (): void => {
    expect(keyOf(ROLE_ID.RETIRED)).toBeUndefined();
    expect(transform.rejects).toMatchObject([
      { id: ROLE_ID.RETIRED, reason: 'role-deleted', blocking: false },
    ]);
  });

  it('gives a colliding API role name the next free key', (): void => {
    expect(keyOf(ROLE_ID.CLASH)).toBe('staf-2');
    expect(customRow('staf-2')).toMatchObject({
      label: 'staf',
      permissions: '[]',
    });
  });

  it('maps an API role named exactly like a Rust lookup name to that fixed role', (): void => {
    const named = rolesTransform([
      {
        id: 'r1',
        name: 'Mentor',
        description: '',
        permissions: '[]',
        created_at: 1,
        updated_at: 1,
        deleted_at: null,
      },
    ]);
    expect(named.roleKeyById.get('r1')).toBe('mentor');
    expect(named.customRoles).toEqual([]);
  });
});
