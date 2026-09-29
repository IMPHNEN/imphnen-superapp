import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EDatabase } from '#/shared/errors.ts';
import {
  ProfileRepo,
  type TProfileRepo,
  type TProfileRow,
} from '#/profile/domain/profile.ts';
import {
  avatarWrite,
  profileRead,
  profileWrite,
} from '#/profile/infrastructure/profile-queries.ts';
import { DbService } from '#/platform/db/db-service.ts';

export const profileRepoLayer = Layer.effect(
  ProfileRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const findByUserId: TProfileRepo['findByUserId'] = (userId) =>
      Effect.tryPromise({
        try: () => profileRead(db, userId),
        catch: (cause) => new EDatabase({ cause }),
      });

    const update: TProfileRepo['update'] = (userId, input) =>
      Effect.tryPromise({
        try: async (): Promise<TProfileRow | null> => {
          const existing = await profileRead(db, userId);
          return match(existing)
            .with(P.nullish, (): Promise<null> => Promise.resolve(null))
            .otherwise(async (): Promise<TProfileRow | null> => {
              await profileWrite(db, userId, input);
              return profileRead(db, userId);
            });
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const avatarSet: TProfileRepo['avatarSet'] = (userId, avatar) =>
      Effect.tryPromise({
        try: () => avatarWrite(db, userId, avatar),
        catch: (cause) => new EDatabase({ cause }),
      });

    return ProfileRepo.of({ findByUserId, update, avatarSet });
  })
);
