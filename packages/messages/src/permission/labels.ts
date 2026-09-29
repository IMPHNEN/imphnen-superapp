import type { TPermission, TRole } from '@app/permissions';

export const PERMISSION_LABEL = {
  'user:create': 'Create users',
  'user:read': 'View users',
  'user:update': 'Edit users and reset their passwords',
  'user:delete': 'Delete users',
  'user:activate': 'Activate and deactivate users',
  'role:create': 'Create roles',
  'role:read': 'View roles and the permission catalog',
  'role:update': 'Edit roles',
  'role:delete': 'Delete roles',
  'activity:read': 'View the activity log',
  'gacha-item:create': 'Create gacha items',
  'gacha-item:read': 'View gacha items',
  'gacha-item:update': 'Edit gacha items',
  'gacha-item:delete': 'Delete gacha items',
  'gacha:roll': 'Roll the gacha',
  'gacha-claim:read': 'View own gacha prizes',
  'gacha-claim:manage': 'View and fulfil every gacha prize',
  'gacha-credit:read': 'View own gacha credits',
  'gacha-credit:grant': 'Grant gacha credits to users',
  'mentor:read': 'View mentors',
  'mentor:register': 'Apply to become a mentor',
  'mentor:update': 'Edit any mentor',
  'mentor:verify': 'Verify mentor applications',
  'mentor:delete': 'Delete mentors',
  'mentor-profile:read': 'View own mentor profile',
  'mentor-profile:update': 'Edit own mentor profile',
  'mentoring-session:read': 'View own mentoring sessions',
  'mentoring-session:create': 'Book mentoring sessions',
  'mentoring-session:update': 'Update own mentoring sessions',
  'mentoring-session:manage': 'Manage every mentoring session',
  'event:create': 'Create events',
  'event:update': 'Edit events',
  'event:delete': 'Delete events',
  'testimonial:create': 'Submit testimonials',
  'testimonial:moderate': 'Approve, edit and delete testimonials',
  'roadmap:create': 'Create roadmap items',
  'roadmap:update': 'Edit roadmap items',
  'roadmap:delete': 'Delete roadmap items',
  'roadmap:vote': 'Vote on roadmap items',
  'qr-campaign:create': 'Create QR campaigns',
  'qr-campaign:read': 'View QR campaigns',
  'qr-campaign:update': 'Edit QR campaigns',
  'qr-campaign:delete': 'Delete QR campaigns',
  'qr-user:manage': 'Manage QR campaign users',
  'hackathon:participate': 'Join the hackathon, teams and submissions',
  'hackathon:manage': 'Manage the hackathon',
} as const satisfies Record<TPermission, string>;

export const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  mentor: 'Mentor',
  user: 'User',
} as const satisfies Record<TRole, string>;

export const ROLE_DESCRIPTION = {
  superadmin: 'Full access, including ownership bypass.',
  admin: 'Full access, including user and role management.',
  mentor: 'A member who mentors: manages their own profile and sessions.',
  user: 'A community member.',
} as const satisfies Record<TRole, string>;

const isLabelledRole = (role: string): role is TRole =>
  Object.hasOwn(ROLE_LABEL, role);

export const roleLabel = (role: string): string =>
  isLabelledRole(role) ? ROLE_LABEL[role] : role;
