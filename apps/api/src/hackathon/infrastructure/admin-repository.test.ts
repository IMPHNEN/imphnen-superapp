import { HACKATHON_LIMIT, HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { AdminRepo } from '#/hackathon/domain/admin-repo.ts';
import { SubmissionRepo } from '#/hackathon/domain/submission-repo.ts';
import { WinnerRepo } from '#/hackathon/domain/award-repo.ts';
import { seededDbCreate } from '#/hackathon/infrastructure/testing/seed.ts';
import {
  inviteAndAccept,
  teamOf,
} from '#/hackathon/infrastructure/testing/team-fixtures.ts';

const PAGE = { page: 1, pageSize: 20 };
const PROJECT = 'Enggan Ngoding';

describe('admin and winner queries on D1', () => {
  it('lists participants, teams and submissions with their relations', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);
    await seeded.run(
      SubmissionRepo.use((repo) =>
        repo.create(
          {
            teamId,
            projectName: PROJECT,
            description: 'x',
            repositoryUrl: 'https://github.com/imphnen/enggan',
            screenshotKeys: [],
          },
          leader,
          HACKATHON_LIMIT.SUBMIT_MIN_MEMBERS
        )
      )
    );
    await seeded.run(
      WinnerRepo.use((repo) => repo.upsert({ teamId, rank: 1, prize: null }))
    );

    const participants = await seeded.run(
      AdminRepo.use((repo) => repo.participants({ ...PAGE, search: member }))
    );
    const teams = await seeded.run(AdminRepo.use((repo) => repo.teams(PAGE)));
    const submissions = await seeded.run(
      AdminRepo.use((repo) => repo.submissions({ ...PAGE, search: 'enggan' }))
    );
    const winners = await seeded.run(WinnerRepo.use((repo) => repo.list()));

    expect(participants.total).toBe(1);
    expect(participants.items[0]?.team?.id).toBe(teamId);
    expect(teams.items[0]).toMatchObject({
      memberCount: 2,
      hasSubmission: true,
      submissionStatus: HACKATHON_SUBMISSION_STATUS.DRAFT,
    });
    expect(submissions.items[0]?.team.id).toBe(teamId);
    expect(winners[0]).toMatchObject({ rank: 1, projectName: PROJECT });
  });
});
