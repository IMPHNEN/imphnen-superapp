import { HACKATHON_MESSAGE } from '@app/messages';
import { HACKATHON_DECISION_STATUS } from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { EBadRequest, EConflict, EForbidden } from '#/shared/errors.ts';
import type { TInvitationRow } from '#/hackathon/domain/hackathon-rows.ts';
import { JOIN_OUTCOME } from '#/hackathon/domain/join-outcome.ts';
import { invitationRespond } from '#/hackathon/application/invitation-respond.ts';
import {
  AFTER_TEAM_CLOSE,
  failureAt,
  LEADER,
  OUTSIDER,
  ok,
  runAt,
  TEAM_ID,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const INVITATION_ID = '55555555-5555-4555-8555-555555555555';

const invitation: TInvitationRow = {
  id: INVITATION_ID,
  team: { id: TEAM_ID, name: 'Ngoding Santai', logoKey: null },
  inviter: { id: LEADER.id, name: LEADER.name, image: null },
  inviteeEmail: OUTSIDER.email,
  status: HACKATHON_DECISION_STATUS.PENDING,
  createdAt: new Date('2025-10-01T00:00:00Z'),
  updatedAt: new Date('2025-10-01T00:00:00Z'),
};

describe('invitationRespond', () => {
  it('refuses an invitation addressed to another email', async (): Promise<void> => {
    const accept = ok(JOIN_OUTCOME.JOINED);

    const error = await failureAt(
      invitationRespond({ id: INVITATION_ID, accept: true }, LEADER),
      { invitation: { find: ok(invitation), accept } }
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(accept).not.toHaveBeenCalled();
  });

  it('matches the invitee email case-insensitively', async (): Promise<void> => {
    const accept = ok(JOIN_OUTCOME.JOINED);

    const result = await runAt(
      invitationRespond(
        { id: INVITATION_ID, accept: true },
        { ...OUTSIDER, email: OUTSIDER.email.toUpperCase() }
      ),
      { invitation: { find: ok(invitation), accept } }
    );

    expect(result).toEqual({
      id: INVITATION_ID,
      status: HACKATHON_DECISION_STATUS.ACCEPTED,
    });
    expect(accept).toHaveBeenCalledWith(invitation, OUTSIDER.id);
  });

  it('refuses an invitation that has already been answered', async (): Promise<void> => {
    const error = await failureAt(
      invitationRespond({ id: INVITATION_ID, accept: false }, OUTSIDER),
      {
        invitation: {
          find: ok({
            ...invitation,
            status: HACKATHON_DECISION_STATUS.REJECTED,
          }),
        },
      }
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });

  it('lets the invitee decline after the deadline but not accept', async (): Promise<void> => {
    const reject = ok(true);
    const accept = ok(JOIN_OUTCOME.JOINED);
    const fakes = { invitation: { find: ok(invitation), reject, accept } };

    const declined = await runAt(
      invitationRespond({ id: INVITATION_ID, accept: false }, OUTSIDER),
      fakes,
      AFTER_TEAM_CLOSE
    );
    const error = await failureAt(
      invitationRespond({ id: INVITATION_ID, accept: true }, OUTSIDER),
      fakes,
      AFTER_TEAM_CLOSE
    );

    expect(declined.status).toBe(HACKATHON_DECISION_STATUS.REJECTED);
    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED,
    });
    expect(accept).not.toHaveBeenCalled();
  });

  it('reports a full team when the guarded insert refuses the join', async (): Promise<void> => {
    const error = await failureAt(
      invitationRespond({ id: INVITATION_ID, accept: true }, OUTSIDER),
      {
        invitation: {
          find: ok(invitation),
          accept: ok(JOIN_OUTCOME.TEAM_FULL),
        },
      }
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(error).toMatchObject({ message: HACKATHON_MESSAGE.TEAM_FULL });
  });
});
