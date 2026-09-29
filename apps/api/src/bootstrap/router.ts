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
import { permissionModule } from '#/permission/index.ts';
import { roleModule } from '#/role/index.ts';
import { userModule } from '#/user/index.ts';
import { implementer } from '#/platform/orpc/implementer.ts';

const appRouter = implementer.router({
  health: healthModule.routerBuild(),
  me: authModule.routerBuild(),
  user: userModule.routerBuild(),
  role: roleModule.routerBuild(),
  permission: permissionModule.routerBuild(),
  activity: activityModule.routerBuild(),
  gacha: gachaModule.routerBuild(),
  event: eventModule.routerBuild(),
  testimonial: testimonialModule.routerBuild(),
  roadmap: roadmapModule.routerBuild(),
  qr: qrModule.routerBuild(),
  mentor: mentorModule.routerBuild(),
  mentoring: mentoringModule.routerBuild(),
  hackathon: hackathonModule.routerBuild(),
  profile: profileModule.routerBuild(),
});

export type TAppRouter = typeof appRouter;

export const routerBuild = (): TAppRouter => appRouter;
