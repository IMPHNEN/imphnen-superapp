import type { TMentoringOverview } from '@app/schemas';
import { Effect } from 'effect';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentoringOverview = Effect.fn('mentoringOverview')(
  function* (): Effect.fn.Return<
    TMentoringOverview,
    EDatabase,
    TMentoringSessionRepoId
  > {
    const sessionRepo = yield* MentoringSessionRepo;
    return yield* sessionRepo.overview();
  }
);
