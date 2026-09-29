import { PERMISSION, ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { roleEnsure } from '#/role/application/role-ensure.ts';
import { EBadRequest } from '#/shared/errors.ts';
import type {
  TCustomRoleRow,
  TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';
import { CustomRoleRepo } from '#/role/domain/custom-role.ts';

const KEY = 'reviewer';

const row: TCustomRoleRow = {
  id: '11111111-1111-4111-8111-111111111111',
  key: KEY,
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

describe('roleEnsure', () => {
  it('accepts a fixed role without touching the repository', async (): Promise<void> => {
    const findByKey = vi.fn();

    await Effect.runPromise(
      roleEnsure(ROLE.USER).pipe(Effect.provide(layerBuild(findByKey)))
    );

    expect(findByKey).not.toHaveBeenCalled();
  });

  it('holds a share lock on the custom role row so a concurrent delete waits', async (): Promise<void> => {
    const findByKey = vi.fn().mockReturnValue(Effect.succeed(row));

    await Effect.runPromise(
      roleEnsure(KEY).pipe(Effect.provide(layerBuild(findByKey)))
    );

    expect(findByKey).toHaveBeenCalledWith(KEY);
  });

  it('fails with EBadRequest when the custom role is gone', async (): Promise<void> => {
    const findByKey = vi.fn().mockReturnValue(Effect.succeed(null));

    const error = await Effect.runPromise(
      roleEnsure(KEY).pipe(Effect.provide(layerBuild(findByKey)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });
});

describe('roleExists', () => {});
