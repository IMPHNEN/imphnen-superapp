import {
  DEPENDENCY,
  DEPENDENCY_STATUS,
  HEALTH_STATUS,
  type TDependencyReport,
} from '@app/schemas';
import { APP_VERSION } from '@app/version';
import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { readinessGet } from '#/health/application/readiness-get.ts';
import { HealthProbe } from '#/health/domain/health.ts';

const probeLayer = (
  reports: readonly TDependencyReport[]
): Layer.Layer<typeof HealthProbe.Identifier> =>
  Layer.succeed(
    HealthProbe,
    HealthProbe.of({ check: () => Effect.succeed(reports) })
  );

const UP = [
  { name: DEPENDENCY.DATABASE, status: DEPENDENCY_STATUS.UP },
  { name: DEPENDENCY.STORAGE, status: DEPENDENCY_STATUS.UP },
] as const;

const CACHE_DOWN = [
  { name: DEPENDENCY.DATABASE, status: DEPENDENCY_STATUS.UP },
  { name: DEPENDENCY.STORAGE, status: DEPENDENCY_STATUS.DOWN },
] as const;

describe('readinessGet', () => {
  it('reports ready and names the version when every dependency is up', async (): Promise<void> => {
    const result = await Effect.runPromise(
      readinessGet().pipe(Effect.provide(probeLayer(UP)))
    );

    expect(result.status).toBe(HEALTH_STATUS.READY);
    expect(result.version).toBe(APP_VERSION);
    expect(result.dependencies).toHaveLength(2);
  });

  it('reports not ready when a single dependency is down', async (): Promise<void> => {
    const result = await Effect.runPromise(
      readinessGet().pipe(Effect.provide(probeLayer(CACHE_DOWN)))
    );

    expect(result.status).toBe(HEALTH_STATUS.NOT_READY);
    expect(result.dependencies).toContainEqual({
      name: DEPENDENCY.STORAGE,
      status: DEPENDENCY_STATUS.DOWN,
    });
  });
});
