import { HACKATHON_DEADLINE, HACKATHON_TEAM_VISIBILITY } from '@app/schemas';
import type { TSessionUser } from '#/shared/session.ts';
import type { TTeamRow } from '#/hackathon/domain/hackathon-rows.ts';

export const LEADER: TSessionUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'leader@imphnen.test',
  name: 'Leader',
  role: 'user',
};

export const OUTSIDER: TSessionUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'outsider@imphnen.test',
  name: 'Outsider',
  role: 'user',
};

export const TEAM_ID = '33333333-3333-4333-8333-333333333333';
export const STORAGE_BASE = 'https://cdn.imphnen.test/';
export const BEFORE_DEADLINES = Date.parse('2025-11-01T00:00:00Z');
export const AFTER_TEAM_CLOSE = Date.parse(
  HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE
);
export const AFTER_SUBMISSION_CLOSE = Date.parse(
  HACKATHON_DEADLINE.SUBMISSION_CLOSE
);

export const teamRowBuild = (): TTeamRow => ({
  id: TEAM_ID,
  name: 'Ngoding Santai',
  description: null,
  city: 'Medan',
  visibility: HACKATHON_TEAM_VISIBILITY.PUBLIC,
  logoKey: null,
  bannerKey: null,
  leaderId: LEADER.id,
  createdAt: new Date('2025-10-01T00:00:00Z'),
  updatedAt: new Date('2025-10-01T00:00:00Z'),
});
