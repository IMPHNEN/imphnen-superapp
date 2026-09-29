import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { PERMISSION, ROLE } from '@app/permissions';
import type { TRoleCreateInput } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { roleCreate } from '#/role/application/role-create.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepoId,
  type TCustomRoleRow,
} from '#/role/domain/custom-role.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EConflict } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';

const input: TRoleCreateInput = {
  key: 'reviewer',
  label: 'Reviewer',
  description: 'Reads notes',
  permissions: [PERMISSION.USER_READ],
};

const row: TCustomRoleRow = {
  id: '11111111-1111-4111-8111-111111111111',
  key: input.key,
  label: input.label,
  description: input.description ?? null,
  permissions: input.permissions,
  createdBy: ACTOR_ID,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

type TMocks = { findByKey: Mock; create: Mock; insert: Mock };

const mocksBuild = (existing: TCustomRoleRow | null): TMocks => ({
  findByKey: vi.fn().mockReturnValue(Effect.succeed(existing)),
  create: vi.fn().mockReturnValue(Effect.succeed(row)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TCustomRoleRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      CustomRoleRepo,
      CustomRoleRepo.of({
        memberCounts: vi.fn(),
        list: vi.fn(),
        findByKey: mocks.findByKey,
        create: mocks.create,
        update: vi.fn(),
        remove: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('roleCreate', () => {
  it('refuses a key that belongs to a fixed role without asking the database', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      roleCreate({ ...input, key: ROLE.ADMIN }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.findByKey).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('refuses a key that a custom role already uses', async (): Promise<void> => {
    const mocks = mocksBuild(row);

    const error = await Effect.runPromise(
      roleCreate(input, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates the role, attributes it to the actor and logs the activity', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const result = await Effect.runPromise(
      roleCreate(input, ACTOR_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(result).toMatchObject({
      key: input.key,
      label: input.label,
      fixed: false,
      memberCount: 0,
      permissions: [PERMISSION.USER_READ],
    });
    expect(mocks.create).toHaveBeenCalledWith(input, ACTOR_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        action: ACTIVITY_ACTION.ROLE_CREATE,
        resourceId: input.key,
        metadata: {
          [ACTIVITY_DETAIL.LABEL]: input.label,
          [ACTIVITY_DETAIL.PERMISSION_COUNT]: 1,
        },
      })
    );
  });
});
