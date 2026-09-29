import { Layer, ManagedRuntime } from 'effect';
import { activityModule } from '#/activity/index.ts';
import { authModule } from '#/auth/index.ts';
import { healthModule } from '#/health/index.ts';
import { gachaModule } from '#/gacha/index.ts';
import { eventModule } from '#/event/index.ts';
import { testimonialModule } from '#/testimonial/index.ts';
import { roadmapModule } from '#/roadmap/index.ts';
import { qrModule } from '#/qr/index.ts';
import { mentorModule } from '#/mentor/index.ts';
import { mentoringModule } from '#/mentoring/index.ts';
import { hackathonModule } from '#/hackathon/index.ts';
import { profileModule } from '#/profile/index.ts';
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
  roleModule.layer,
  gachaModule.layer,
  eventModule.layer,
  testimonialModule.layer,
  roadmapModule.layer,
  qrModule.layer,
  mentorModule.layer,
  mentoringModule.layer,
  hackathonModule.layer,
  profileModule.layer
);

export const AppLayer = userModule.layer.pipe(
  Layer.provideMerge(authModule.layer),
  Layer.provideMerge(moduleLayer),
  Layer.provideMerge(platformLayer)
);

export const runtime = ManagedRuntime.make(AppLayer);

export type TAppRuntime = typeof runtime;

export type TAppRuntimeServices = Layer.Success<typeof AppLayer>;
