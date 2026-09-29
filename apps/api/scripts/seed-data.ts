import { ROLE, type TRole } from '@app/permissions';

export type TSeedUser = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: TRole;
};

export const SEED_ENV = {
  PASSWORD: 'SEED_PASSWORD',
} as const;

export const SEED_DEFAULT_PASSWORD = 'password123';

export const SEED_USERS: readonly TSeedUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'superadmin@imphnen.dev',
    name: 'Super Admin',
    role: ROLE.SUPERADMIN,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'admin@imphnen.dev',
    name: 'Admin',
    role: ROLE.ADMIN,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'admin2@imphnen.dev',
    name: 'Admin Two',
    role: ROLE.ADMIN,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'mentor1@imphnen.dev',
    name: 'Mentor One',
    role: ROLE.MENTOR,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    email: 'mentor2@imphnen.dev',
    name: 'Mentor Two',
    role: ROLE.MENTOR,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    email: 'user1@imphnen.dev',
    name: 'User One',
    role: ROLE.USER,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    email: 'user2@imphnen.dev',
    name: 'User Two',
    role: ROLE.USER,
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    email: 'user3@imphnen.dev',
    name: 'User Three',
    role: ROLE.USER,
  },
];
