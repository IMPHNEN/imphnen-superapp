import { readinessGet } from '#/health/application/readiness-get.ts';
import { healthProbeLayer } from '#/health/infrastructure/health-probe.ts';
import { healthRouterBuild } from '#/health/presentation/health-router.ts';
import { healthMount } from '#/health/presentation/mount-health.ts';

export { healthMount };

export const healthModule: {
  layer: typeof healthProbeLayer;
  routerBuild: typeof healthRouterBuild;
  readiness: typeof readinessGet;
} = {
  layer: healthProbeLayer,
  routerBuild: healthRouterBuild,
  readiness: readinessGet,
};
