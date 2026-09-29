import { ROLE } from '@app/permissions';
import type { TUserCreateInput } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { EConflict } from '#/shared/errors.ts';
import { userCreate } from '#/user/application/user-create.ts';
import type { TUserRow, TUserRepoId } from '#/user/domain/user.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { CustomRoleRepo, type TCustomRoleRepoId } from '#/role/index.ts';
import { UserRepo } from '#/user/domain/user.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';

const row: TUserRow = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Member',
  email: 'member@test.app',
  emailVerified: false,
  image: null,
  role: ROLE.USER,
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const input: TUserCreateInput = {
  name: 'Member',
  email: 'member@test.app',
  password: 'Password123',
  role: ROLE.USER,
  isActive: true,
};

const layerBuild = (
  findByEmail: Mock,
  create: Mock,
  insert: Mock
): Layer.Layer<TUserRepoId | TCustomRoleRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      UserRepo,
      UserRepo.of({
        list: vi.fn(),
        findById: vi.fn(),
        findByEmail,
        create,
        update: vi.fn(),
        setActive: vi.fn(),
        remove: vi.fn(),
        resetPassword: vi.fn(),
      })
    ),
    Layer.succeed(
      CustomRoleRepo,
      CustomRoleRepo.of({
        memberCounts: vi.fn(),
        list: vi.fn(),
        findByKey: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      })
    ),
    Layer.succeed(ActivityRecorder, ActivityRecorder.of({ insert }))
  );

describe('userCreate', () => {
  it('creates the user and logs the activity', async (): Promise<void> => {
    const findByEmail = vi.fn().mockReturnValue(Effect.succeed(null));
    const create = vi.fn().mockReturnValue(Effect.succeed(row));
    const insert = vi.fn().mockReturnValue(Effect.succeed(undefined));

    const result = await Effect.runPromise(
      userCreate(input, ACTOR_ID).pipe(
        Effect.provide(layerBuild(findByEmail, create, insert))
      )
    );

    expect(result.id).toBe(row.id);
    expect(create).toHaveBeenCalledWith(input);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.USER_CREATE,
        resourceId: row.id,
        metadata: {
          [ACTIVITY_DETAIL.EMAIL]: row.email,
          [ACTIVITY_DETAIL.ROLE]: row.role,
        },
      })
    );
  });

  it('fails with EConflict when the email is already taken', async (): Promise<void> => {
    const findByEmail = vi.fn().mockReturnValue(Effect.succeed(row));
    const create = vi.fn();

    const error = await Effect.runPromise(
      userCreate(input, ACTOR_ID).pipe(
        Effect.provide(layerBuild(findByEmail, create, vi.fn())),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(create).not.toHaveBeenCalled();
  });
});
