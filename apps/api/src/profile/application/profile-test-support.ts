import { ROLE } from '@app/permissions';
import { Effect, Layer } from 'effect';
import { type Mock, vi } from 'vitest';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  ProfileRepo,
  type TProfileRepoId,
  type TProfileRow,
} from '#/profile/domain/profile.ts';

export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const PUBLIC_URL = 'https://cdn.test/object';

export const profileRow: TProfileRow = {
  user: {
    id: USER_ID,
    name: 'Member',
    email: 'member@test.app',
    emailVerified: true,
    image: null,
    role: ROLE.USER,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  extension: null,
};

export type TProfileMocks = {
  findByUserId: Mock;
  update: Mock;
  avatarSet: Mock;
  put: Mock;
  remove: Mock;
  insert: Mock;
};

export const profileMocksBuild = (
  row: TProfileRow | null,
  previousKey: string | null = null
): TProfileMocks => ({
  findByUserId: vi.fn().mockReturnValue(Effect.succeed(row)),
  update: vi.fn().mockReturnValue(Effect.succeed(row)),
  avatarSet: vi.fn().mockReturnValue(Effect.succeed(previousKey)),
  put: vi.fn().mockReturnValue(Effect.succeed(PUBLIC_URL)),
  remove: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

export const profileLayerBuild = (
  mocks: TProfileMocks
): Layer.Layer<TProfileRepoId | TStorageServiceId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      ProfileRepo,
      ProfileRepo.of({
        findByUserId: mocks.findByUserId,
        update: mocks.update,
        avatarSet: mocks.avatarSet,
      })
    ),
    Layer.succeed(
      StorageService,
      StorageService.of({
        put: mocks.put,
        remove: mocks.remove,
        get: vi.fn(),
        publicUrlOf: (key: string): string => `${PUBLIC_URL}/${key}`,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );
