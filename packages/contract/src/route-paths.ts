import { GACHA_ROUTE_PATH } from './route-paths/gacha.ts';
import { EVENT_ROUTE_PATH } from './route-paths/event.ts';
import { TESTIMONIAL_ROUTE_PATH } from './route-paths/testimonial.ts';
import { ROADMAP_ROUTE_PATH } from './route-paths/roadmap.ts';
import { QR_ROUTE_PATH } from './route-paths/qr.ts';
import { MENTOR_ROUTE_PATH } from './route-paths/mentor.ts';
import { MENTORING_ROUTE_PATH } from './route-paths/mentoring.ts';
import { HACKATHON_ROUTE_PATH } from './route-paths/hackathon.ts';
import { PROFILE_ROUTE_PATH } from './route-paths/profile.ts';

const RESOURCE = {
  USERS: '/users',
  ROLES: '/roles',
} as const;

export const ROUTE_PATH = {
  HEALTH: '/health',
  HEALTHZ: '/healthz',
  READY: '/ready',
  METRICS: '/metrics',
  ME: '/me',
  PERMISSIONS: '/permissions',
  ACTIVITY: '/activity',
  USERS: RESOURCE.USERS,
  USER: `${RESOURCE.USERS}/{id}`,
  USER_PASSWORD: `${RESOURCE.USERS}/{id}/password`,
  ROLES: RESOURCE.ROLES,
  ROLE: `${RESOURCE.ROLES}/{key}`,
  ...GACHA_ROUTE_PATH,
  ...EVENT_ROUTE_PATH,
  ...TESTIMONIAL_ROUTE_PATH,
  ...ROADMAP_ROUTE_PATH,
  ...QR_ROUTE_PATH,
  ...MENTOR_ROUTE_PATH,
  ...MENTORING_ROUTE_PATH,
  ...HACKATHON_ROUTE_PATH,
  ...PROFILE_ROUTE_PATH,
} as const;
export type TRoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH];
