import {
  HACKATHON_DECISION_STATUS,
  HACKATHON_LIMIT,
  HACKATHON_TEAM_VISIBILITY,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { EConflict } from '#/shared/errors.ts';
import {
  hackathonInvitation,
  hackathonJoinRequest,
  hackathonTeam,
} from '#/platform/db/tables/hackathon.ts';
import { InvitationRepo } from '#/hackathon/domain/invitation-repo.ts';
import { JoinRequestRepo } from '#/hackathon/domain/join-request-repo.ts';
import { JOIN_OUTCOME } from '#/hackathon/domain/join-outcome.ts';
import { MembershipRepo } from '#/hackathon/domain/membership-repo.ts';
import { TeamRepo } from '#/hackathon/domain/team-repo.ts';
import {
  emailOf,
  seededDbCreate,
} from '#/hackathon/infrastructure/testing/seed.ts';
import {
  CITY,
  invite,
  inviteAndAccept,
  memberCount,
  teamOf,
} from '#/hackathon/infrastructure/testing/team-fixtures.ts';

describe('team membership invariants on D1', () => {
  it('keeps a user in at most one team and rolls the losing team back', async (): Promise<void> => {
    const seeded = await seededDbCreate(3);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);

    const [again, fromMember] = await Promise.all([
      seeded.fail(
        TeamRepo.use((repo) =>
          repo.create(
            {
              name: 'x',
              city: CITY,
              visibility: HACKATHON_TEAM_VISIBILITY.PUBLIC,
            },
            { id: leader, email: emailOf(leader) }
          )
        )
      ),
      seeded.fail(
        TeamRepo.use((repo) =>
          repo.create(
            {
              name: 'y',
              city: CITY,
              visibility: HACKATHON_TEAM_VISIBILITY.PUBLIC,
            },
            { id: member, email: emailOf(member) }
          )
        )
      ),
    ]);
    const [teams] = await seeded.db
      .select({ value: count() })
      .from(hackathonTeam);

    expect(again).toBeInstanceOf(EConflict);
    expect(fromMember).toBeInstanceOf(EConflict);
    expect(teams?.value).toBe(1);
  });

  it('never lets racing accepts push a team past the member limit', async (): Promise<void> => {
    const seeded = await seededDbCreate(HACKATHON_LIMIT.TEAM_MAX_MEMBERS + 2);
    const [leader = '', ...others] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    const invitations = await Promise.all(
      A.map(others, (userId) => seeded.run(invite(teamId, leader, userId)))
    );

    const outcomes = await Promise.all(
      A.mapWithIndex(invitations, (index, invitation) =>
        seeded.run(
          InvitationRepo.use((repo) =>
            repo.accept(invitation, others[index] ?? '')
          )
        )
      )
    );

    expect(
      A.filter(outcomes, (found) => found === JOIN_OUTCOME.JOINED)
    ).toHaveLength(HACKATHON_LIMIT.TEAM_MAX_MEMBERS - 1);
    expect(
      A.filter(outcomes, (found) => found === JOIN_OUTCOME.TEAM_FULL)
    ).toHaveLength(A.length(others) - (HACKATHON_LIMIT.TEAM_MAX_MEMBERS - 1));
    expect(await memberCount(seeded, teamId)).toBe(
      HACKATHON_LIMIT.TEAM_MAX_MEMBERS
    );
  });

  it("closes the joiner's other invitations and requests in the same batch", async (): Promise<void> => {
    const seeded = await seededDbCreate(4);
    const [first = '', joiner = '', second = '', third = ''] = seeded.users;
    const teamA = await teamOf(seeded, first);
    const teamB = await teamOf(seeded, second);
    const teamC = await teamOf(seeded, third);
    const invitationA = await seeded.run(invite(teamA, first, joiner));
    await seeded.run(invite(teamB, second, joiner));
    await seeded.run(
      JoinRequestRepo.use((repo) =>
        repo.create({ teamId: teamC, userId: joiner, message: '' })
      )
    );

    const outcome = await seeded.run(
      InvitationRepo.use((repo) => repo.accept(invitationA, joiner))
    );
    const invitations = await seeded.db
      .select({
        teamId: hackathonInvitation.teamId,
        status: hackathonInvitation.status,
      })
      .from(hackathonInvitation)
      .orderBy(hackathonInvitation.teamId);
    const [request] = await seeded.db.select().from(hackathonJoinRequest);

    expect(outcome).toBe(JOIN_OUTCOME.JOINED);
    expect(invitations).toEqual(
      expect.arrayContaining([
        { teamId: teamA, status: HACKATHON_DECISION_STATUS.ACCEPTED },
        { teamId: teamB, status: HACKATHON_DECISION_STATUS.REJECTED },
      ])
    );
    expect(request?.status).toBe(HACKATHON_DECISION_STATUS.REJECTED);
  });

  it('does not accept an answered invitation a second time', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', joiner = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    const invitation = await seeded.run(invite(teamId, leader, joiner));
    await seeded.run(
      InvitationRepo.use((repo) => repo.accept(invitation, joiner))
    );

    const again = await seeded.run(
      InvitationRepo.use((repo) => repo.accept(invitation, joiner))
    );

    expect(again).toBe(JOIN_OUTCOME.NOT_PENDING);
    expect(await memberCount(seeded, teamId)).toBe(2);
  });

  it('refuses a second pending join request and a second pending invitation', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', joiner = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    const request = JoinRequestRepo.use((repo) =>
      repo.create({ teamId, userId: joiner, message: '' })
    );
    await seeded.run(request);
    await seeded.run(invite(teamId, leader, joiner));

    expect(await seeded.fail(request)).toBeInstanceOf(EConflict);
    expect(await seeded.fail(invite(teamId, leader, joiner))).toBeInstanceOf(
      EConflict
    );
  });

  it('deletes a team only while the leader is alone', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);

    const blocked = await seeded.run(
      TeamRepo.use((repo) => repo.removeIfAlone(teamId))
    );
    const left = await seeded.run(
      MembershipRepo.use((repo) => repo.removeMember(teamId, member))
    );
    const deleted = await seeded.run(
      TeamRepo.use((repo) => repo.removeIfAlone(teamId))
    );

    expect([blocked, left, deleted]).toEqual([false, true, true]);
    expect(await memberCount(seeded, teamId)).toBe(0);
  });
});
