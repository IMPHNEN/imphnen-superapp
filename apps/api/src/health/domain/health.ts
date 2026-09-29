import type { TDependencyReport } from '@app/schemas';
import { Context, type Effect } from 'effect';
import { SERVICE_TAG } from '#/platform/service-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type THealthProbe = {
  check: () => Effect.Effect<readonly TDependencyReport[]>;
};

export type THealthProbeId = TServiceId<typeof SERVICE_TAG.HEALTH_PROBE>;

export const HealthProbe = Context.Service<THealthProbeId, THealthProbe>(
  SERVICE_TAG.HEALTH_PROBE
);
