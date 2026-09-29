import { Layer, ManagedRuntime } from 'effect';
import { activityModule } from '#/activity/index.ts';
import { authModule } from '#/auth/index.ts';
import { healthModule } from '#/health/index.ts';
import { dbServiceLayer } from '#/platform/db/db-service.ts';
import { mailServiceLayer } from '#/platform/mail/mail-service.ts';
import { storageServiceLayer } from '#/platform/storage/storage-service.ts';
import { roleModule } from '#/role/index.ts';
import { userModule } from '#/user/index.ts';

const platformLayer = Layer.mergeAll(
  dbServiceLayer,
  mailServiceLayer,
  storageServiceLayer
);

const moduleLayer = Layer.mergeAll(
  healthModule.layer,
  activityModule.layer,
  roleModule.layer
);

export const AppLayer = userModule.layer.pipe(
  Layer.provideMerge(authModule.layer),
  Layer.provideMerge(moduleLayer),
  Layer.provideMerge(platformLayer)
);

export const runtime = ManagedRuntime.make(AppLayer);

export type TAppRuntime = typeof runtime;

export type TAppRuntimeServices = Layer.Success<typeof AppLayer>;
