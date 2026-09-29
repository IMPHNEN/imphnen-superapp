import { PERMISSION } from '@app/permissions';
import { describe, expect, it } from 'vitest';
import {
  permissionsResolve,
  storedPermissionsOf,
} from './permission-resolve.ts';

describe('legacy permission resolution', () => {
  it('resolves seeded roles that store permission ids', (): void => {
    const resolved = permissionsResolve([
      '7c15e31d-36e2-49f9-97db-138c03fb0cf6',
      '14c6a1cd-5c63-4643-89b5-b1a5f9920cc0',
    ]);
    expect(resolved.keys).toEqual([
      PERMISSION.USER_READ,
      PERMISSION.GACHA_ROLL,
    ]);
    expect(resolved.unmapped).toEqual([]);
  });

  it('resolves API roles that store display names, de-duplicated in catalog order', (): void => {
    const resolved = permissionsResolve([
      'Execute Gacha Rolls',
      'Read Detail Users',
      'Read List Users',
      'Manage All Roles',
    ]);
    expect(resolved.keys).toEqual([
      PERMISSION.USER_READ,
      PERMISSION.ROLE_CREATE,
      PERMISSION.ROLE_READ,
      PERMISSION.ROLE_UPDATE,
      PERMISSION.ROLE_DELETE,
      PERMISSION.GACHA_ROLL,
    ]);
  });

  it('detects Administrator by name or by id', (): void => {
    expect(permissionsResolve(['Administrator']).administrator).toBe(true);
    expect(
      permissionsResolve(['d6e7f8a9-0123-4567-8901-6789012345ab']).administrator
    ).toBe(true);
    expect(permissionsResolve(['Read List Users']).administrator).toBe(false);
  });

  it('matches the uppercase Delete Gacha Rolls id exactly and maps it to nothing', (): void => {
    expect(
      permissionsResolve(['12345678-ABCD-EFAB-CDEF-0123456789AB'])
    ).toEqual({ administrator: false, keys: [], unmapped: [] });
    expect(
      permissionsResolve(['12345678-abcd-efab-cdef-0123456789ab']).unmapped
    ).toEqual(['12345678-abcd-efab-cdef-0123456789ab']);
  });

  it('reports unknown strings and non-string values as unmapped', (): void => {
    expect(permissionsResolve(['read list users', 7, null]).unmapped).toEqual([
      'read list users',
      '7',
      'null',
    ]);
  });

  it('reads the stored JSON array and treats anything else as empty', (): void => {
    expect(storedPermissionsOf('["a","b"]')).toEqual(['a', 'b']);
    expect(storedPermissionsOf(null)).toEqual([]);
    expect(storedPermissionsOf('null')).toEqual([]);
    expect(storedPermissionsOf('{"a":1}')).toEqual([]);
    expect(storedPermissionsOf('[broken')).toEqual([]);
  });
});
