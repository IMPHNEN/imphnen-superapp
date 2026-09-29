import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { EForbidden, ENotFound } from '#/shared/errors.ts';
import { userDelete } from '#/user/application/user-delete.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
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
  emailVerified: false,
  image: null,
  role: ROLE.MEMBER,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

type TMocks = { findById: Mock; remove: Mock; insert: Mock };

const mocksBuild = (found: TUserRow | null): TMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(found)),
  remove: vi.fn().mockReturnValue(Effect.succeed(true)),
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
        findById: mocks.findById,
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: mocks.remove,
        resetPassword: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('userDelete', () => {
  it('refuses to delete the acting user', async (): Promise<void> => {
    const mocks = mocksBuild(target);

    const error = await Effect.runPromise(
      userDelete({ id: ACTOR_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('fails with ENotFound for an unknown user', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      userDelete({ id: TARGET_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('deletes the user and records their email and role', async (): Promise<void> => {
    const mocks = mocksBuild(target);

    await Effect.runPromise(
      userDelete({ id: TARGET_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.remove).toHaveBeenCalledWith(TARGET_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.USER_DELETE,
        metadata: {
          [ACTIVITY_DETAIL.EMAIL]: target.email,
          [ACTIVITY_DETAIL.ROLE]: target.role,
        },
      })
    );
  });
});
