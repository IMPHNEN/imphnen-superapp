import { D } from '@mobily/ts-belt';
import { eq, isNotNull } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EDatabase } from '#/shared/errors.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { hackathonParticipant } from '#/platform/db/tables/hackathon.ts';
import {
  ParticipantRepo,
  type TParticipantRepo,
} from '#/hackathon/domain/participant-repo.ts';

export const participantFields = {
  userId: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  phoneNumber: hackathonParticipant.phoneNumber,
  location: hackathonParticipant.location,
  bio: hackathonParticipant.bio,
  skills: hackathonParticipant.skills,
  registered: isNotNull(hackathonParticipant.userId).mapWith(Boolean),
};

export const participantRepoLayer = Layer.effect(
  ParticipantRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const find: TParticipantRepo['find'] = (userId) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select(participantFields)
            .from(user)
            .leftJoin(
              hackathonParticipant,
              eq(hackathonParticipant.userId, user.id)
            )
            .where(eq(user.id, userId))
            .limit(1);
          return row === undefined
            ? null
            : D.merge(row, { skills: row.skills ?? [] });
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const upsert: TParticipantRepo['upsert'] = (input, userId) =>
      Effect.tryPromise({
        try: async () => {
          const patch = D.filter(
            D.merge(input, { updatedAt: new Date() }),
            (value): boolean => value !== undefined
          );
          await db
            .insert(hackathonParticipant)
            .values(D.merge(patch, { userId }))
            .onConflictDoUpdate({
              target: hackathonParticipant.userId,
              set: patch,
            });
        },
        catch: (cause) => new EDatabase({ cause }),
      }).pipe(Effect.andThen(() => find(userId)));

    return ParticipantRepo.of({ find, upsert });
  })
);
