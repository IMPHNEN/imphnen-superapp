import { ALL_PERMISSIONS, canAll, PERMISSION, ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { permissionsResolve } from '#/role/domain/permissions-resolve.ts';
import type {
  TCustomRoleRow,
  TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';
import { CustomRoleRepo } from '#/role/domain/custom-role.ts';

const customRow: TCustomRoleRow = {
  id: '11111111-1111-4111-8111-111111111111',
  key: 'reviewer',
  label: 'Reviewer',
  description: null,
  permissions: [PERMISSION.USER_READ],
  createdBy: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const layerBuild = (findByKey: Mock): Layer.Layer<TCustomRoleRepoId> =>
  Layer.succeed(
    CustomRoleRepo,
    CustomRoleRepo.of({
      memberCounts: vi.fn(),
      list: vi.fn(),
      findByKey,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    })
  );

describe('permissionsResolve', () => {
  it('resolves fixed roles from the code map without touching the database', async (): Promise<void> => {
    const findByKey = vi.fn();

    const granted = await Effect.runPromise(
      permissionsResolve(ROLE.ADMIN).pipe(Effect.provide(layerBuild(findByKey)))
    );

    expect(canAll(granted, ALL_PERMISSIONS)).toBe(true);
    expect(findByKey).not.toHaveBeenCalled();
  });

  it('resolves custom roles from the repository', async (): Promise<void> => {
    const findByKey = vi.fn().mockReturnValue(Effect.succeed(customRow));

    const granted = await Effect.runPromise(
      permissionsResolve('reviewer').pipe(Effect.provide(layerBuild(findByKey)))
    );

    expect(granted).toEqual([PERMISSION.USER_READ]);
  });

  it('resolves unknown roles to no permissions', async (): Promise<void> => {
    const findByKey = vi.fn().mockReturnValue(Effect.succeed(null));

    const granted = await Effect.runPromise(
      permissionsResolve('ghost').pipe(Effect.provide(layerBuild(findByKey)))
    );

    expect(granted).toEqual([]);
  });
});
