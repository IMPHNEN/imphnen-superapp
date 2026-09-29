import type { ContractRouterClient } from '@orpc/contract';
import { activityContract } from './activity.ts';
import { healthContract } from './health.ts';
import { meContract } from './me.ts';
import { permissionContract } from './permission.ts';
import { roleContract } from './role.ts';
import { userContract } from './user.ts';
import { gachaContract } from './gacha.ts';
import { eventContract } from './event.ts';
import { testimonialContract } from './testimonial.ts';
import { roadmapContract } from './roadmap.ts';
import { qrContract } from './qr.ts';
import { mentorContract } from './mentor.ts';
import { mentoringContract } from './mentoring.ts';
import { hackathonContract } from './hackathon.ts';
import { profileContract } from './profile.ts';

export { HTTP_METHOD, type THttpMethod } from './http-methods.ts';
export { ROUTE_PATH, type TRoutePath } from './route-paths.ts';

export const appContract = {
  health: healthContract,
  me: meContract,
  user: userContract,
  role: roleContract,
  permission: permissionContract,
  activity: activityContract,
  gacha: gachaContract,
  event: eventContract,
  testimonial: testimonialContract,
  roadmap: roadmapContract,
  qr: qrContract,
  mentor: mentorContract,
  mentoring: mentoringContract,
  hackathon: hackathonContract,
  profile: profileContract,
};

export type TAppContract = typeof appContract;

export type TAppRouterClient = ContractRouterClient<TAppContract>;
