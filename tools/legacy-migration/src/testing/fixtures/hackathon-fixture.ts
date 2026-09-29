import type {
  TLegacyHackathonTeam,
  TLegacyHackathonUser,
} from '../../legacy/legacy-hackathon-rows.ts';
import { fixtureId, T0, T1, T2 } from '../fixture-builders.ts';
import { USER_ID } from './iam-fixture.ts';

export const HACKER_ID = {
  SARI: fixtureId(1101),
  RENAMED: USER_ID.RENAMED,
  NEWBIE: fixtureId(1103),
  TWIN_A: fixtureId(1104),
  TWIN_B: fixtureId(1105),
  LEAD: fixtureId(1106),
} as const;

export const TEAM_ID = {
  ALPHA: fixtureId(1201),
  BETA: fixtureId(1202),
  GHOST: fixtureId(1203),
  GAMMA: fixtureId(1204),
} as const;

const hacker = (
  partial: Partial<TLegacyHackathonUser> &
    Pick<TLegacyHackathonUser, 'id' | 'email'>
): TLegacyHackathonUser => ({
  fullname: 'Peserta Hackathon',
  avatar: null,
  phone_number: '0812000000',
  location: 'Surabaya',
  bio: null,
  skills: '["React","Go"]',
  is_admin: false,
  created_at: T0,
  updated_at: T1,
  ...partial,
});

export const HACKATHON_USERS: readonly TLegacyHackathonUser[] = [
  hacker({
    id: HACKER_ID.SARI,
    email: 'Sari@Imphnen.dev',
    avatar: 'avatars/sari.png',
  }),
  hacker({
    id: HACKER_ID.RENAMED,
    email: 'lama@hackathon.dev',
    is_admin: true,
    skills: null,
  }),
  hacker({
    id: HACKER_ID.NEWBIE,
    email: 'NewBie@Gmail.com',
    fullname: 'Newbie Coder',
    is_admin: true,
    avatar: 'https://avatars.githubusercontent.com/u/1',
  }),
  hacker({
    id: HACKER_ID.TWIN_A,
    email: 'kembar@gmail.com',
    fullname: 'Kembar Lama',
    updated_at: T0,
  }),
  hacker({
    id: HACKER_ID.TWIN_B,
    email: 'Kembar@Gmail.com',
    fullname: 'Kembar Baru',
    updated_at: T2,
  }),
  hacker({
    id: HACKER_ID.LEAD,
    email: 'lead@gmail.com',
    fullname: 'Lead Gamma',
    created_at: null,
    updated_at: null,
  }),
];

const team = (
  partial: Partial<TLegacyHackathonTeam> &
    Pick<TLegacyHackathonTeam, 'id' | 'leader_id'>
): TLegacyHackathonTeam => ({
  name: 'Tim Hebat',
  description: null,
  city: 'Kota Bandung',
  visibility: 'public',
  logo: null,
  banner: null,
  created_at: T0,
  updated_at: T1,
  ...partial,
});

export const HACKATHON_TEAMS: readonly TLegacyHackathonTeam[] = [
  team({
    id: TEAM_ID.ALPHA,
    leader_id: HACKER_ID.SARI,
    logo: 'teams/alpha-logo.png',
    banner: 'https://i.imgur.com/banner.webp',
  }),
  team({
    id: TEAM_ID.BETA,
    leader_id: HACKER_ID.NEWBIE,
    visibility: 'Private ',
    banner: 'https://example.com/no-extension',
  }),
  team({ id: TEAM_ID.GHOST, leader_id: fixtureId(1999) }),
  team({ id: TEAM_ID.GAMMA, leader_id: HACKER_ID.LEAD, visibility: 'PUBLIC' }),
];
