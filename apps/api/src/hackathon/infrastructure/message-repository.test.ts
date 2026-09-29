import { A } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import { hackathonMessage } from '#/platform/db/tables/hackathon.ts';
import {
  MESSAGE_DIRECTION,
  MessageRepo,
  type TMessagePage,
  type TMessageQuery,
} from '#/hackathon/domain/message-repo.ts';
import { seededDbCreate } from '#/hackathon/infrastructure/testing/seed.ts';
import { teamOf } from '#/hackathon/infrastructure/testing/team-fixtures.ts';

const MESSAGE_COUNT = 5;
const PAGE = 2;
const BASE_TIME = Date.parse('2025-11-01T00:00:00Z');

describe('message cursor pagination on D1', () => {
  it('pages history backwards and polls forwards in chronological order', async (): Promise<void> => {
    const seeded = await seededDbCreate(1);
    const [leader = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    const bodies = A.makeWithIndex(MESSAGE_COUNT, (index) => `m${index}`);
    await seeded.db.insert(hackathonMessage).values([
      ...A.mapWithIndex(bodies, (index, body) => ({
        teamId,
        userId: leader,
        body,
        createdAt: new Date(BASE_TIME + index),
      })),
    ]);
    const page = (
      query: Omit<TMessageQuery, 'teamId' | 'limit'>
    ): Promise<TMessagePage> =>
      seeded.run(
        MessageRepo.use((repo) => repo.list({ ...query, teamId, limit: PAGE }))
      );
    const bodiesOf = (items: readonly { body: string }[]): readonly string[] =>
      A.map(items, (item) => item.body);

    const latest = await page({
      direction: MESSAGE_DIRECTION.OLDER,
      cursor: null,
    });
    const oldest = latest.items[0];
    const older = await page({
      direction: MESSAGE_DIRECTION.OLDER,
      cursor: oldest === undefined ? null : oldest,
    });
    const newest = older.items[A.length(older.items) - 1];
    const newer = await page({
      direction: MESSAGE_DIRECTION.NEWER,
      cursor: newest === undefined ? null : newest,
    });

    expect(bodiesOf(latest.items)).toEqual(['m3', 'm4']);
    expect(latest.hasMore).toBe(true);
    expect(bodiesOf(older.items)).toEqual(['m1', 'm2']);
    expect(bodiesOf(newer.items)).toEqual(['m3', 'm4']);
    expect(newer.hasMore).toBe(false);
  });
});
