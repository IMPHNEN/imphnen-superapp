import {
  DEPENDENCY_STATUS,
  HEALTH_STATUS,
  type TDependencyReport,
  type THealthStatus,
  type TReadiness,
} from '@app/schemas';
import { APP_VERSION } from '@app/version';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import { HealthProbe, type THealthProbeId } from '#/health/domain/health.ts';

const statusOf = (dependencies: readonly TDependencyReport[]): THealthStatus =>
  match(
    A.every(dependencies, (report) => report.status === DEPENDENCY_STATUS.UP)
  )
    .with(true, (): THealthStatus => HEALTH_STATUS.READY)
    .otherwise((): THealthStatus => HEALTH_STATUS.NOT_READY);

export const readinessGet = Effect.fn('readinessGet')(
  function* (): Effect.fn.Return<TReadiness, never, THealthProbeId> {
    const probe = yield* HealthProbe;
    const dependencies = yield* probe.check();

    return {
      status: statusOf(dependencies),
      version: APP_VERSION,
      dependencies: [...dependencies],
    } as TReadiness;
  }
);
