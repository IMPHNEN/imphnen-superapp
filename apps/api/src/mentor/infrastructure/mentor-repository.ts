import { Effect, Layer } from 'effect';
import { MentorRepo } from '#/mentor/domain/mentor.ts';
import { mentorReadsBuild } from '#/mentor/infrastructure/mentor-read-repository.ts';
import { mentorReviewsBuild } from '#/mentor/infrastructure/mentor-review-repository.ts';
import { mentorWritesBuild } from '#/mentor/infrastructure/mentor-write-repository.ts';
import { DbService } from '#/platform/db/db-service.ts';

export const mentorRepoLayer = Layer.effect(
  MentorRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    return MentorRepo.of({
      ...mentorReadsBuild(db),
      ...mentorWritesBuild(db),
      ...mentorReviewsBuild(db),
    });
  })
);
