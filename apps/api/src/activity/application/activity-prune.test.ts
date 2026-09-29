import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import {
  activityPrune,
  cutoffFor,
} from '#/activity/application/activity-prune.ts';
import { ActivityPruner } from '#/activity/domain/activity.ts';

const RETENTION_DAYS = 90;
const NOW = new Date('2026-09-18T00:00:00Z');
const BATCH = 100;

describe('cutoffFor', () => {
  it('puts the cutoff exactly the retention window behind now', (): void => {
    const cutoff = cutoffFor(RETENTION_DAYS, NOW);

    expect(cutoff.toISOString()).toBe('2026-06-20T00:00:00.000Z');
  });
});

describe('activityPrune', () => {
  it('stops after one pass when the batch comes back short', async (): Promise<void> => {
    const deleteOlderThan = vi.fn().mockReturnValue(Effect.succeed(12));

    const removed = await Effect.runPromise(
      activityPrune(RETENTION_DAYS, NOW, BATCH).pipe(
        Effect.provide(
          Layer.succeed(ActivityPruner, ActivityPruner.of({ deleteOlderThan }))
        )
      )
    );

    expect(removed).toBe(12);
    expect(deleteOlderThan).toHaveBeenCalledTimes(1);
  });

  it('keeps going while every batch comes back full', async (): Promise<void> => {
    const deleteOlderThan = vi
      .fn()
      .mockReturnValueOnce(Effect.succeed(BATCH))
      .mockReturnValueOnce(Effect.succeed(BATCH))
      .mockReturnValue(Effect.succeed(5));

    const removed = await Effect.runPromise(
      activityPrune(RETENTION_DAYS, NOW, BATCH).pipe(
        Effect.provide(
          Layer.succeed(ActivityPruner, ActivityPruner.of({ deleteOlderThan }))
        )
      )
    );

    expect(removed).toBe(BATCH * 2 + 5);
    expect(deleteOlderThan).toHaveBeenCalledTimes(3);
  });

  it('passes the same cutoff to every batch so the window cannot drift', async (): Promise<void> => {
    const deleteOlderThan = vi
      .fn()
      .mockReturnValueOnce(Effect.succeed(BATCH))
      .mockReturnValue(Effect.succeed(0));

    await Effect.runPromise(
      activityPrune(RETENTION_DAYS, NOW, BATCH).pipe(
        Effect.provide(
          Layer.succeed(ActivityPruner, ActivityPruner.of({ deleteOlderThan }))
        )
      )
    );

    const cutoffs = deleteOlderThan.mock.calls.map((call) => call[0]);
    expect(cutoffs[0]).toStrictEqual(cutoffs[1]);
  });

  it('does nothing when there is nothing old enough', async (): Promise<void> => {
    const deleteOlderThan = vi.fn().mockReturnValue(Effect.succeed(0));

    const removed = await Effect.runPromise(
      activityPrune(RETENTION_DAYS, NOW, BATCH).pipe(
        Effect.provide(
          Layer.succeed(ActivityPruner, ActivityPruner.of({ deleteOlderThan }))
        )
      )
    );

    expect(removed).toBe(0);
    expect(deleteOlderThan).toHaveBeenCalledTimes(1);
  });
});
