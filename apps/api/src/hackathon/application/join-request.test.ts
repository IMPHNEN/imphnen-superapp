import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DECISION_STATUS,
  HACKATHON_TEAM_VISIBILITY,
} from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { EConflict, EForbidden } from '#/shared/errors.ts';
import type { TJoinRequestRow } from '#/hackathon/domain/hackathon-rows.ts';
import { JOIN_OUTCOME } from '#/hackathon/domain/join-outcome.ts';
import { joinRequestCreate } from '#/hackathon/application/join-request-create.ts';
import { joinRequestRespond } from '#/hackathon/application/join-request-respond.ts';
import {
  failureAt,
  LEADER,
  OUTSIDER,
  ok,
  runAt,
  TEAM_ID,
  teamRowBuild,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const REQUEST_ID = '66666666-6666-4666-8666-666666666666';

const request: TJoinRequestRow = {
  id: REQUEST_ID,
  team: { id: TEAM_ID, name: 'Ngoding Santai', logoKey: null },
  user: { id: OUTSIDER.id, name: OUTSIDER.name, image: null },
  userEmail: OUTSIDER.email,
  message: '',
  status: HACKATHON_DECISION_STATUS.PENDING,
  createdAt: new Date('2025-10-01T00:00:00Z'),
  updatedAt: new Date('2025-10-01T00:00:00Z'),
};

describe('joinRequestCreate', () => {
  it('refuses a request to an invite-only team', async (): Promise<void> => {
    const create = ok(request);

    const error = await failureAt(
      joinRequestCreate({ teamId: TEAM_ID, message: '' }, OUTSIDER.id),
      {
        team: {
          find: ok({
            ...teamRowBuild(),
            visibility: HACKATHON_TEAM_VISIBILITY.PRIVATE,
          }),
        },
        joinRequest: { create },
      }
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses a request to a team whose members are locked', async (): Promise<void> => {
    const error = await failureAt(
      joinRequestCreate({ teamId: TEAM_ID, message: '' }, OUTSIDER.id),
      {
        membership: {
          teamState: ok({ exists: true, memberCount: 2, hasSubmission: true }),
        },
      }
    );

    expect(error).toMatchObject({ message: HACKATHON_MESSAGE.TEAM_LOCKED });
  });
});

describe('joinRequestRespond', () => {
  it('lets only the team leader answer', async (): Promise<void> => {
    const accept = ok(JOIN_OUTCOME.JOINED);

    const error = await failureAt(
      joinRequestRespond({ id: REQUEST_ID, accept: true }, OUTSIDER.id),
      { joinRequest: { find: ok(request), accept } }
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(accept).not.toHaveBeenCalled();
  });

  it('accepts a pending request as the leader', async (): Promise<void> => {
    const accept = ok(JOIN_OUTCOME.JOINED);

    const result = await runAt(
      joinRequestRespond({ id: REQUEST_ID, accept: true }, LEADER.id),
      { joinRequest: { find: ok(request), accept } }
    );

    expect(result.status).toBe(HACKATHON_DECISION_STATUS.ACCEPTED);
    expect(accept).toHaveBeenCalledWith(request);
  });

  it('reports a locked team when a submission appeared meanwhile', async (): Promise<void> => {
    const error = await failureAt(
      joinRequestRespond({ id: REQUEST_ID, accept: true }, LEADER.id),
      {
        joinRequest: {
          find: ok(request),
          accept: ok(JOIN_OUTCOME.TEAM_LOCKED),
        },
      }
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(error).toMatchObject({ message: HACKATHON_MESSAGE.TEAM_LOCKED });
  });
});
