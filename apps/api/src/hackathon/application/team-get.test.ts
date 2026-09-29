import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { teamGet } from '#/hackathon/application/team-get.ts';
import {
  LEADER,
  OUTSIDER,
  ok,
  runAt,
  STORAGE_BASE,
  TEAM_ID,
  teamRowBuild,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const LOGO_KEY = 'hackathon/team/44444444-4444-4444-8444-444444444444.png';

const detail = {
  ...teamRowBuild(),
  logoKey: LOGO_KEY,
  leader: { id: LEADER.id, name: LEADER.name, image: null },
  memberCount: 1,
  hasSubmission: false,
  members: [
    {
      user: { id: LEADER.id, name: LEADER.name, image: null },
      role: HACKATHON_MEMBER_ROLE.LEADER,
      joinedAt: new Date('2025-10-01T00:00:00Z'),
      email: LEADER.email,
      phoneNumber: '+62 812 0000 0000',
    },
  ],
};

describe('teamGet', () => {
  it('hides contact details from anonymous visitors and outsiders', async (): Promise<void> => {
    const fakes = { team: { findDetail: ok(detail) } };

    const anonymous = await runAt(
      teamGet({ id: TEAM_ID }, { userId: null, canManage: false }),
      fakes
    );
    const outsider = await runAt(
      teamGet({ id: TEAM_ID }, { userId: OUTSIDER.id, canManage: false }),
      fakes
    );

    expect(anonymous.members[0]?.contact).toBeNull();
    expect(outsider.members[0]?.contact).toBeNull();
    expect(anonymous.logoUrl).toBe(`${STORAGE_BASE}${LOGO_KEY}`);
  });

  it('shows contact details to team members and hackathon managers', async (): Promise<void> => {
    const fakes = { team: { findDetail: ok(detail) } };

    const member = await runAt(
      teamGet({ id: TEAM_ID }, { userId: LEADER.id, canManage: false }),
      fakes
    );
    const manager = await runAt(
      teamGet({ id: TEAM_ID }, { userId: OUTSIDER.id, canManage: true }),
      fakes
    );

    expect(member.members[0]?.contact).toEqual({
      email: LEADER.email,
      phoneNumber: detail.members[0]?.phoneNumber,
    });
    expect(manager.members[0]?.contact).not.toBeNull();
  });
});
