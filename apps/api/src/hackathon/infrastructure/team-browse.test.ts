import {
  HACKATHON_TEAM_VISIBILITY,
  type THackathonTeamBrowseInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import type { TRowPage } from '#/shared/pagination.ts';
import type { TTeamSummaryRow } from '#/hackathon/domain/hackathon-rows.ts';
import { TeamRepo } from '#/hackathon/domain/team-repo.ts';
import {
  emailOf,
  seededDbCreate,
} from '#/hackathon/infrastructure/testing/seed.ts';
import {
  inviteAndAccept,
  teamOf,
} from '#/hackathon/infrastructure/testing/team-fixtures.ts';

const page: THackathonTeamBrowseInput = { page: 1, pageSize: 20 };

describe('team browse on D1', () => {
  it('lists public teams only, filters by size and city case-insensitively', async (): Promise<void> => {
    const seeded = await seededDbCreate(4);
    const [first = '', second = '', member = '', hidden = ''] = seeded.users;
    const small = await teamOf(seeded, first);
    const big = await teamOf(seeded, second);
    await inviteAndAccept(seeded, big, second, member);
    await seeded.run(
      TeamRepo.use((repo) =>
        repo.create(
          {
            name: hidden,
            city: 'Medan',
            visibility: HACKATHON_TEAM_VISIBILITY.PRIVATE,
          },
          { id: hidden, email: emailOf(hidden) }
        )
      )
    );
    const browse = (
      input: THackathonTeamBrowseInput
    ): Promise<TRowPage<TTeamSummaryRow>> =>
      seeded.run(TeamRepo.use((repo) => repo.browse(input)));
    const idsOf = (items: readonly { id: string }[]): readonly string[] =>
      A.map(items, (item) => item.id);

    const all = await browse(page);
    const pairs = await browse({ ...page, minMembers: 2 });
    const byCity = await browse({ ...page, city: 'medan' });

    expect(all.total).toBe(2);
    expect(idsOf(all.items)).toEqual(expect.arrayContaining([small, big]));
    expect(idsOf(pairs.items)).toEqual([big]);
    expect(A.find(all.items, (item) => item.id === big)?.memberCount).toBe(2);
    expect(byCity.total).toBe(2);
  });
});
