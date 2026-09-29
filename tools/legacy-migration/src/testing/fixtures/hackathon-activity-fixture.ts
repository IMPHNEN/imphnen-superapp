import type {
  TLegacyHackathonInvitation,
  TLegacyHackathonJoinRequest,
  TLegacyHackathonMember,
  TLegacyHackathonMessage,
  TLegacyHackathonSubmission,
  TLegacyHackathonWinner,
} from '../../legacy/legacy-hackathon-rows.ts';
import { fixtureId, T0, T1, T2 } from '../fixture-builders.ts';
import { HACKER_ID, TEAM_ID } from './hackathon-fixture.ts';

const member = (
  id: number,
  teamId: string,
  userId: string,
  role: string,
  status: string,
  joinedAt: number | null
): TLegacyHackathonMember => ({
  id: fixtureId(id),
  team_id: teamId,
  user_id: userId,
  role,
  status,
  joined_at: joinedAt,
});

export const HACKATHON_MEMBERS: readonly TLegacyHackathonMember[] = [
  member(1301, TEAM_ID.ALPHA, HACKER_ID.SARI, 'leader', 'active', T0),
  member(1302, TEAM_ID.ALPHA, HACKER_ID.RENAMED, 'Member', 'active', T1),
  member(1303, TEAM_ID.ALPHA, HACKER_ID.NEWBIE, 'member', 'active', T1),
  member(1304, TEAM_ID.BETA, HACKER_ID.TWIN_A, 'member', 'active', T2),
  member(1305, TEAM_ID.GAMMA, HACKER_ID.TWIN_B, 'member', 'active', T1),
  member(1306, TEAM_ID.BETA, HACKER_ID.TWIN_B, 'member', 'left', T1),
  member(1307, TEAM_ID.GHOST, HACKER_ID.LEAD, 'member', 'active', null),
];

const invitation = (
  id: number,
  email: string,
  status: string,
  createdAt: number | null,
  inviter: string = HACKER_ID.SARI
): TLegacyHackathonInvitation => ({
  id: fixtureId(id),
  team_id: TEAM_ID.ALPHA,
  inviter_id: inviter,
  invitee_email: email,
  status,
  created_at: createdAt,
});

export const HACKATHON_INVITATIONS: readonly TLegacyHackathonInvitation[] = [
  invitation(1401, 'Teman@Gmail.com', 'pending', T0),
  invitation(1402, 'teman@gmail.com ', 'pending', T1),
  invitation(1403, 'lain@gmail.com', 'expired', T1),
  invitation(1404, 'x@gmail.com', 'pending', T1, fixtureId(1998)),
];

export const HACKATHON_JOIN_REQUESTS: readonly TLegacyHackathonJoinRequest[] = [
  {
    id: fixtureId(1501),
    team_id: TEAM_ID.BETA,
    user_id: HACKER_ID.TWIN_A,
    message: null,
    status: 'pending',
    created_at: T1,
  },
  {
    id: fixtureId(1502),
    team_id: TEAM_ID.BETA,
    user_id: HACKER_ID.TWIN_B,
    message: 'Boleh gabung?',
    status: 'pending',
    created_at: T2,
  },
  {
    id: fixtureId(1503),
    team_id: TEAM_ID.GHOST,
    user_id: HACKER_ID.SARI,
    message: 'hai',
    status: 'pending',
    created_at: T2,
  },
];

export const SUBMISSION_ID = {
  DRAFT: fixtureId(1601),
  FINAL: fixtureId(1602),
  BETA: fixtureId(1603),
} as const;

export const HACKATHON_SUBMISSIONS: readonly TLegacyHackathonSubmission[] = [
  {
    id: SUBMISSION_ID.DRAFT,
    team_id: TEAM_ID.ALPHA,
    project_name: 'Draft',
    description: 'd',
    repository_url: 'https://github.com/a/b',
    demo_url: null,
    presentation_url: null,
    screenshots: null,
    status: 'draft',
    submitted_at: null,
    submitted_by: HACKER_ID.SARI,
    created_at: T0,
    updated_at: T2,
  },
  {
    id: SUBMISSION_ID.FINAL,
    team_id: TEAM_ID.ALPHA,
    project_name: 'Final',
    description: 'f',
    repository_url: 'https://github.com/a/c',
    demo_url: 'https://demo.dev',
    presentation_url: 'uploads/deck.pdf',
    screenshots:
      '["shots/one.png","https://i.imgur.com/two.jpg","https://example.com/three"]',
    status: 'confirmed',
    submitted_at: T2,
    submitted_by: fixtureId(1997),
    created_at: T1,
    updated_at: T1,
  },
  {
    id: SUBMISSION_ID.BETA,
    team_id: TEAM_ID.BETA,
    project_name: 'Beta',
    description: 'b',
    repository_url: 'https://github.com/b/b',
    demo_url: null,
    presentation_url: 'https://slides.com/x',
    screenshots: '[]',
    status: 'weird',
    submitted_at: null,
    submitted_by: HACKER_ID.NEWBIE,
    created_at: null,
    updated_at: null,
  },
];

export const HACKATHON_WINNERS: readonly TLegacyHackathonWinner[] = [
  {
    id: fixtureId(1701),
    team_id: TEAM_ID.ALPHA,
    rank: 1,
    prize: 'Rp 10.000.000',
    announced_at: null,
    created_at: T2,
    updated_at: null,
  },
  {
    id: fixtureId(1702),
    team_id: TEAM_ID.GHOST,
    rank: 2,
    prize: null,
    announced_at: T2,
    created_at: T2,
    updated_at: T2,
  },
];

export const HACKATHON_MESSAGES: readonly TLegacyHackathonMessage[] = [
  {
    id: fixtureId(1801),
    team_id: TEAM_ID.ALPHA,
    user_id: HACKER_ID.RENAMED,
    message: "Semangat! Jangan lupa ';' ya",
    created_at: T1,
  },
  {
    id: fixtureId(1802),
    team_id: TEAM_ID.ALPHA,
    user_id: fixtureId(1996),
    message: 'hantu',
    created_at: T1,
  },
  {
    id: fixtureId(1803),
    team_id: TEAM_ID.GHOST,
    user_id: HACKER_ID.SARI,
    message: 'x',
    created_at: null,
  },
];
