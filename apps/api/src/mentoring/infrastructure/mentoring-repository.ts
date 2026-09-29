import { Effect, Layer } from 'effect';
import { MentoringSessionRepo } from '#/mentoring/domain/mentoring-session.ts';
import { sessionReadsBuild } from '#/mentoring/infrastructure/session-read-repository.ts';
import { sessionStatsBuild } from '#/mentoring/infrastructure/session-stats-repository.ts';
import { sessionWritesBuild } from '#/mentoring/infrastructure/session-write-repository.ts';
import { DbService } from '#/platform/db/db-service.ts';

export const mentoringSessionRepoLayer = Layer.effect(
  MentoringSessionRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    return MentoringSessionRepo.of({
      ...sessionReadsBuild(db),
      ...sessionWritesBuild(db),
      ...sessionStatsBuild(db),
    });
  })
);
