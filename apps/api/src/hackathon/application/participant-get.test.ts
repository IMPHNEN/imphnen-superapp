import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { participantGet } from '#/hackathon/application/participant-get.ts';
import type { TParticipantRow } from '#/hackathon/domain/hackathon-rows.ts';
import { MembershipRepo } from '#/hackathon/domain/membership-repo.ts';
import { ParticipantRepo } from '#/hackathon/domain/participant-repo.ts';
import { TeamRepo } from '#/hackathon/domain/team-repo.ts';
import { StorageService } from '#/platform/storage/storage-service.ts';
import { ENotFound } from '#/shared/errors.ts';

const USER_ID = '44444444-4444-4444-8444-444444444444';

const unregistered: TParticipantRow = {
  userId: USER_ID,
  name: 'Fresh',
  email: 'fresh@imphnen.test',
  image: null,
  phoneNumber: null,
  location: null,
  bio: null,
  skills: [],
  registered: false,
};

const layerBuild = (found: TParticipantRow | null) =>
  Layer.mergeAll(
    Layer.succeed(
      ParticipantRepo,
      ParticipantRepo.of({
        find: vi.fn().mockReturnValue(Effect.succeed(found)),
        upsert: vi.fn(),
      })
    ),
    Layer.succeed(
      MembershipRepo,
      MembershipRepo.of({
        findByUser: vi.fn().mockReturnValue(Effect.succeed(null)),
        findByEmail: vi.fn(),
        teamState: vi.fn(),
        removeMember: vi.fn(),
      })
    ),
    Layer.succeed(
      TeamRepo,
      TeamRepo.of({
        browse: vi.fn(),
        find: vi.fn(),
        findDetail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        removeIfAlone: vi.fn(),
        remove: vi.fn(),
      })
    ),
    Layer.succeed(
      StorageService,
      StorageService.of({
        put: vi.fn(),
        remove: vi.fn(),
        get: vi.fn(),
        publicUrlOf: (key: string): string => key,
      })
    )
  );

describe('participantGet', () => {
  it('answers for a platform user who never filled a hackathon profile', async (): Promise<void> => {
    const found = await Effect.runPromise(
      participantGet({ userId: USER_ID }).pipe(
        Effect.provide(layerBuild(unregistered))
      )
    );

    expect(found).toMatchObject({ userId: USER_ID, name: 'Fresh', team: null });
  });

  it('is not found for an id that is no user at all', async (): Promise<void> => {
    const error = await Effect.runPromise(
      participantGet({ userId: USER_ID }).pipe(
        Effect.provide(layerBuild(null)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
