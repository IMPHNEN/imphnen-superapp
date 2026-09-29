import { Context, Effect, Layer } from 'effect';
import { bindings } from '#/platform/config/env.ts';
import { dbCreate, type TDb } from '#/platform/db/client.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import { SERVICE_TAG } from '#/platform/service-tags.ts';

export type TDbService = { readonly db: TDb };

export type TDbServiceId = TServiceId<typeof SERVICE_TAG.DB>;

export const DbService = Context.Service<TDbServiceId, TDbService>(
  SERVICE_TAG.DB
);

export const dbServiceLayer = Layer.effect(
  DbService,
  Effect.sync(() => DbService.of({ db: dbCreate(bindings.DB) }))
);
