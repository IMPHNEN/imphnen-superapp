import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { PERMISSION, ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { roleDelete } from '#/role/application/role-delete.ts';
import { EBadRequest, EConflict, ENotFound } from '#/shared/errors.ts';
import type {
  TCustomRoleRow,
  TRoleMemberCounts,
  TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { CustomRoleRepo } from '#/role/domain/custom-role.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
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

type TMocks = {
  findByKey: Mock;
  memberCounts: Mock;
  remove: Mock;
  insert: Mock;
};

const mocksBuild = (
  found: TCustomRoleRow | null,
  counts: TRoleMemberCounts
): TMocks => ({
  findByKey: vi.fn().mockReturnValue(Effect.succeed(found)),
  memberCounts: vi.fn().mockReturnValue(Effect.succeed(counts)),
  remove: vi.fn().mockReturnValue(Effect.succeed(true)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TCustomRoleRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      CustomRoleRepo,
      CustomRoleRepo.of({
        memberCounts: mocks.memberCounts,
        list: vi.fn(),
        findByKey: mocks.findByKey,
        create: vi.fn(),
        update: vi.fn(),
        remove: mocks.remove,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('roleDelete', () => {
  it('refuses to delete a fixed role', async (): Promise<void> => {
    const mocks = mocksBuild(null, {});

    const error = await Effect.runPromise(
      roleDelete({ key: ROLE.ADMIN }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.findByKey).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('fails with ENotFound when the custom role does not exist', async (): Promise<void> => {
    const mocks = mocksBuild(null, {});

    const error = await Effect.runPromise(
      roleDelete({ key: KEY }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.memberCounts).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('refuses to delete a custom role that still has members', async (): Promise<void> => {
    const mocks = mocksBuild(row, { [KEY]: 2 });

    const error = await Effect.runPromise(
      roleDelete({ key: KEY }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('locks the role row for update before counting its members', async (): Promise<void> => {
    const mocks = mocksBuild(row, {});

    await Effect.runPromise(
      roleDelete({ key: KEY }, ACTOR_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(mocks.findByKey).toHaveBeenCalledWith(KEY);
    expect(mocks.findByKey.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.memberCounts.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('deletes an unused custom role and logs the activity', async (): Promise<void> => {
    const mocks = mocksBuild(row, {});

    const result = await Effect.runPromise(
      roleDelete({ key: KEY }, ACTOR_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(result).toEqual({ key: KEY });
    expect(mocks.remove).toHaveBeenCalledWith(KEY);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.ROLE_DELETE,
        resourceId: KEY,
        metadata: {
          [ACTIVITY_DETAIL.LABEL]: row.label,
          [ACTIVITY_DETAIL.PERMISSION_COUNT]: 1,
        },
      })
    );
  });
});
