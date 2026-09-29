import { Effect } from 'effect';
import { match } from 'ts-pattern';
import {
  ActivityPruner,
  type TActivityPrunerId,
} from '#/activity/domain/activity.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const ACTIVITY_PRUNE_BATCH = 1_000;

const MS_PER_DAY = 86_400_000;
const NOTHING_REMOVED = 0;

export const cutoffFor = (retentionDays: number, now: Date): Date =>
  new Date(now.getTime() - retentionDays * MS_PER_DAY);

const pruneFrom = (
  cutoff: Date,
  batchSize: number,
  removed: number
): Effect.Effect<number, EDatabase, TActivityPrunerId> =>
  Effect.gen(function* () {
    const pruner = yield* ActivityPruner;
    const deleted = yield* pruner.deleteOlderThan(cutoff, batchSize);

    return yield* match(deleted < batchSize)
      .with(
        true,
        (): Effect.Effect<number, EDatabase, TActivityPrunerId> =>
          Effect.succeed(removed + deleted)
      )
      .otherwise(
        (): Effect.Effect<number, EDatabase, TActivityPrunerId> =>
          pruneFrom(cutoff, batchSize, removed + deleted)
      );
  });

export const activityPrune = Effect.fn('activityPrune')(function* (
  retentionDays: number,
  now: Date = new Date(),
  batchSize: number = ACTIVITY_PRUNE_BATCH
): Effect.fn.Return<number, EDatabase, TActivityPrunerId> {
  return yield* pruneFrom(
    cutoffFor(retentionDays, now),
    batchSize,
    NOTHING_REMOVED
  );
});
