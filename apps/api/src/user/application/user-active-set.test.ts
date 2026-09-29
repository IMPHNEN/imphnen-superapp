import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EForbidden, ENotFound } from '#/shared/errors.ts';
import { userActiveSet } from '#/user/application/user-active-set.ts';
import {
  USER_FIELD,
  UserRepo,
  type TUserRepoId,
  type TUserRow,
} from '#/user/domain/user.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '11111111-1111-4111-8111-111111111111';

const target: TUserRow = {
  id: TARGET_ID,
  name: 'Member',
  email: 'member@test.app',
  emailVerified: true,
  image: null,
  role: ROLE.USER,
  isActive: false,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

type TMocks = { setActive: Mock; insert: Mock };

const mocksBuild = (updated: TUserRow | null): TMocks => ({
  setActive: vi.fn().mockReturnValue(Effect.succeed(updated)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TUserRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      UserRepo,
      UserRepo.of({
        list: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        setActive: mocks.setActive,
        remove: vi.fn(),
        resetPassword: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('userActiveSet', () => {
  it('refuses to let the actor deactivate themselves', async (): Promise<void> => {
    const mocks = mocksBuild(target);

    const error = await Effect.runPromise(
      userActiveSet({ id: ACTOR_ID, isActive: false }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.setActive).not.toHaveBeenCalled();
  });

  it('fails with ENotFound for a missing or deleted user', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      userActiveSet({ id: TARGET_ID, isActive: true }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('deactivates the user and records the change', async (): Promise<void> => {
    const mocks = mocksBuild(target);

    const result = await Effect.runPromise(
      userActiveSet({ id: TARGET_ID, isActive: false }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result.isActive).toBe(false);
    expect(mocks.setActive).toHaveBeenCalledWith({
      id: TARGET_ID,
      isActive: false,
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.USER_UPDATE,
        metadata: {
          [ACTIVITY_DETAIL.EMAIL]: target.email,
          [ACTIVITY_DETAIL.CHANGED_FIELDS]: USER_FIELD.IS_ACTIVE,
        },
      })
    );
  });
});
