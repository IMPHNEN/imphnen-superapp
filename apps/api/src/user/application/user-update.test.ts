import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { DEFAULT_ROLE, PERMISSION, ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { CustomRoleRepo, type TCustomRoleRepoId } from '#/role/index.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EBadRequest, EForbidden, ENotFound } from '#/shared/errors.ts';
import { userUpdate } from '#/user/application/user-update.ts';
import {
  UserRepo,
  type TUserRepoId,
  type TUserRow,
} from '#/user/domain/user.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOM_ROLE = 'reviewer';
const NEW_NAME = 'Renamed';

const row: TUserRow = {
  id: USER_ID,
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

const customRole = {
  id: '33333333-3333-4333-8333-333333333333',
  key: CUSTOM_ROLE,
  label: 'Reviewer',
  description: null,
  permissions: [PERMISSION.USER_READ],
  createdBy: null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
};

type TMocks = {
  findById: Mock;
  update: Mock;
  findByKey: Mock;
  insert: Mock;
};

const mocksBuild = (
  updated: TUserRow | null,
  roleFound: typeof customRole | null,
  previous: TUserRow | null = row
): TMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(previous)),
  update: vi.fn().mockReturnValue(Effect.succeed(updated)),
  findByKey: vi.fn().mockReturnValue(Effect.succeed(roleFound)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TUserRepoId | TCustomRoleRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      UserRepo,
      UserRepo.of({
        list: vi.fn(),
        findById: mocks.findById,
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: mocks.update,
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
        findByKey: mocks.findByKey,
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('userUpdate', () => {
  it('refuses to let the actor change their own role', async (): Promise<void> => {
    const mocks = mocksBuild(row, null);

    const error = await Effect.runPromise(
      userUpdate({ id: ACTOR_ID, role: DEFAULT_ROLE }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('lets the actor rename themselves', async (): Promise<void> => {
    const mocks = mocksBuild({ ...row, id: ACTOR_ID, name: NEW_NAME }, null, {
      ...row,
      id: ACTOR_ID,
    });

    const result = await Effect.runPromise(
      userUpdate({ id: ACTOR_ID, name: NEW_NAME }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result.name).toBe(NEW_NAME);
    expect(mocks.update).toHaveBeenCalledWith({ id: ACTOR_ID, name: NEW_NAME });
  });

  it('rejects a role that does not exist before touching the user', async (): Promise<void> => {
    const mocks = mocksBuild(row, null);

    const error = await Effect.runPromise(
      userUpdate({ id: USER_ID, role: 'ghost' }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('fails with ENotFound when the user is gone', async (): Promise<void> => {
    const mocks = mocksBuild(null, null, null);

    const error = await Effect.runPromise(
      userUpdate({ id: USER_ID, name: NEW_NAME }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('assigns a custom role and records it in the activity', async (): Promise<void> => {
    const mocks = mocksBuild({ ...row, role: CUSTOM_ROLE }, customRole);

    const result = await Effect.runPromise(
      userUpdate({ id: USER_ID, role: CUSTOM_ROLE }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result.role).toBe(CUSTOM_ROLE);
    expect(mocks.findByKey).toHaveBeenCalledWith(CUSTOM_ROLE);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.USER_UPDATE,
        resourceId: USER_ID,
        metadata: {
          [ACTIVITY_DETAIL.ROLE]: CUSTOM_ROLE,
          [ACTIVITY_DETAIL.PREVIOUS_ROLE]: ROLE.USER,
        },
      })
    );
  });

  it('skips the role lookup and records only the rename when only the name changes', async (): Promise<void> => {
    const mocks = mocksBuild({ ...row, name: NEW_NAME }, null);

    await Effect.runPromise(
      userUpdate({ id: USER_ID, name: NEW_NAME }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.findByKey).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          [ACTIVITY_DETAIL.NAME]: NEW_NAME,
          [ACTIVITY_DETAIL.PREVIOUS_NAME]: row.name,
        },
      })
    );
  });
});
