import { HACKATHON_MESSAGE } from '@app/messages';
import { describe, expect, it } from 'vitest';
import { EBadRequest, EForbidden } from '#/shared/errors.ts';
import type { TMessageRow } from '#/hackathon/domain/hackathon-rows.ts';
import type { TMembershipRepo } from '#/hackathon/domain/membership-repo.ts';
import { MESSAGE_DIRECTION } from '#/hackathon/domain/message-repo.ts';
import { messageDelete } from '#/hackathon/application/message-delete.ts';
import { messageList } from '#/hackathon/application/message-list.ts';
import {
  failureAt,
  LEADER,
  OUTSIDER,
  ok,
  runAt,
  TEAM_ID,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const MESSAGE_ID = '77777777-7777-4777-8777-777777777777';
const AUTHOR_ID = '88888888-8888-4888-8888-888888888888';

const message: TMessageRow = {
  id: MESSAGE_ID,
  teamId: TEAM_ID,
  author: { id: AUTHOR_ID, name: 'Author', image: null },
  body: 'halo',
  createdAt: new Date('2025-10-02T00:00:00Z'),
};

const memberOf = (userId: string): Partial<TMembershipRepo> => ({
  findByUser: ok({ teamId: TEAM_ID, userId, role: 'member' }),
});

describe('messageList', () => {
  it('refuses callers outside the team', async (): Promise<void> => {
    const error = await failureAt(
      messageList({ teamId: TEAM_ID, limit: 20 }, OUTSIDER.id),
      {}
    );

    expect(error).toBeInstanceOf(EForbidden);
  });

  it('polls newer messages after a cursor from the same team', async (): Promise<void> => {
    const list = ok({ items: [message], hasMore: false });

    const page = await runAt(
      messageList({ teamId: TEAM_ID, after: MESSAGE_ID, limit: 20 }, AUTHOR_ID),
      { membership: memberOf(AUTHOR_ID), message: { find: ok(message), list } }
    );

    expect(list).toHaveBeenCalledWith({
      teamId: TEAM_ID,
      direction: MESSAGE_DIRECTION.NEWER,
      cursor: { createdAt: message.createdAt, id: MESSAGE_ID },
      limit: 20,
    });
    expect(page.items[0]?.author.name).toBe('Author');
  });

  it('rejects a cursor that belongs to another team', async (): Promise<void> => {
    const error = await failureAt(
      messageList(
        { teamId: TEAM_ID, before: MESSAGE_ID, limit: 20 },
        AUTHOR_ID
      ),
      {
        membership: memberOf(AUTHOR_ID),
        message: { find: ok({ ...message, teamId: LEADER.id }) },
      }
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.CHAT_CURSOR_INVALID,
    });
  });
});

describe('messageDelete', () => {
  it('lets the author and the team leader delete, nobody else', async (): Promise<void> => {
    const remove = ok(true);
    const fakes = { message: { find: ok(message), remove } };

    await runAt(messageDelete({ id: MESSAGE_ID }, AUTHOR_ID), fakes);
    await runAt(messageDelete({ id: MESSAGE_ID }, LEADER.id), fakes);
    const error = await failureAt(
      messageDelete({ id: MESSAGE_ID }, OUTSIDER.id),
      fakes
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
