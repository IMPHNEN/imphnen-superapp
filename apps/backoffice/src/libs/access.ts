import { canAny, PERMISSION, type TPermission } from '@app/permissions';

export const PAGE_PERMISSION = {
  '/hackathon-dashboard': PERMISSION.HACKATHON_MANAGE,
  '/hackathon-users': PERMISSION.HACKATHON_MANAGE,
  '/hackathon-teams': PERMISSION.HACKATHON_MANAGE,
  '/hackathon-submissions': PERMISSION.HACKATHON_MANAGE,
  '/dashboard-dimentorin': PERMISSION.MENTORING_SESSION_MANAGE,
  '/users-dimentorin': PERMISSION.MENTOR_VERIFY,
  '/session-dimentorin': PERMISSION.MENTORING_SESSION_MANAGE,
  '/roadmap-dimentorin': PERMISSION.ROADMAP_UPDATE,
  '/feedback-review-dimentorin': PERMISSION.MENTORING_SESSION_MANAGE,
  '/settings-dimentorin': PERMISSION.ROLE_READ,
  '/dashboard': PERMISSION.GACHA_ITEM_UPDATE,
  '/gacha-roll': PERMISSION.GACHA_ITEM_UPDATE,
  '/transactions': PERMISSION.GACHA_CLAIM_MANAGE,
  '/prizes': PERMISSION.GACHA_CLAIM_MANAGE,
  '/cms-events': PERMISSION.EVENT_UPDATE,
  '/cms-testimonials': PERMISSION.TESTIMONIAL_MODERATE,
  '/permissions': PERMISSION.ROLE_READ,
  '/roles': PERMISSION.ROLE_READ,
  '/accounts': PERMISSION.USER_READ,
} as const satisfies Record<string, TPermission>;

export type TPagePath = keyof typeof PAGE_PERMISSION;

const PAGE_PATHS = Object.keys(PAGE_PERMISSION) as TPagePath[];

const BACKOFFICE_PERMISSIONS: readonly TPermission[] = [
  ...new Set<TPermission>(Object.values(PAGE_PERMISSION)),
];

export const hasBackofficeAccess = (granted: readonly TPermission[]): boolean =>
  canAny(granted, BACKOFFICE_PERMISSIONS);

export const pagePathOf = (pathname: string): TPagePath | undefined =>
  PAGE_PATHS.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

export const firstAllowedPage = (
  granted: readonly TPermission[]
): TPagePath | undefined =>
  PAGE_PATHS.find((path) => granted.includes(PAGE_PERMISSION[path]));
