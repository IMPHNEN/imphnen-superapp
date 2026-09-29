import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { participantGet } from '#/hackathon/application/participant-get.ts';
import { seededDbCreate } from '#/hackathon/infrastructure/testing/seed.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { StorageService } from '#/platform/storage/storage-service.ts';

const USER_ID = '44444444-4444-4444-8444-444444444444';
const MISSING_USER_ID = '99999999-9999-4999-8999-999999999999';

const storageStub = StorageService.of({
  put: (): Effect.Effect<never> => Effect.die('unused'),
  remove: (): Effect.Effect<never> => Effect.die('unused'),
  get: (): Effect.Effect<never> => Effect.die('unused'),
  publicUrlOf: (key: string): string => key,
});

describe('participantGet', () => {
  it('answers for a platform user who never filled a hackathon profile', async (): Promise<void> => {
    const seeded = await seededDbCreate(1);
    await seeded.db
      .insert(user)
      .values({ id: USER_ID, name: 'Fresh', email: 'fresh@imphnen.test' });

    const found = await seeded.run(
      participantGet({ userId: USER_ID }).pipe(
        Effect.provideService(StorageService, storageStub)
      )
    );

    expect(found).toMatchObject({ userId: USER_ID, name: 'Fresh', team: null });
  });

  it('is not found for an id that is no user at all', async (): Promise<void> => {
    const seeded = await seededDbCreate(1);

    const error = await seeded.fail(
      participantGet({ userId: MISSING_USER_ID }).pipe(
        Effect.provideService(StorageService, storageStub)
      )
    );

    expect(error._tag).toBe('ENotFound');
  });
});
