import { ACTIVITY_ACTION } from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_TEAM_VISIBILITY,
  type THackathonTeamCreateInput,
} from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { EBadRequest, EConflict } from '#/shared/errors.ts';
import { teamCreate } from '#/hackathon/application/team-create.ts';
import {
  AFTER_TEAM_CLOSE,
  failureAt,
  LEADER,
  ok,
  runAt,
  TEAM_ID,
  teamRowBuild,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const input: THackathonTeamCreateInput = {
  name: 'Ngoding Santai',
  city: 'Medan',
  visibility: HACKATHON_TEAM_VISIBILITY.PUBLIC,
};

const detail = {
  ...teamRowBuild(),
  leader: { id: LEADER.id, name: LEADER.name, image: null },
  memberCount: 1,
  hasSubmission: false,
  members: [],
};

describe('teamCreate', () => {
  it('refuses once team registration has closed', async (): Promise<void> => {
    const create = ok(TEAM_ID);

    const error = await failureAt(
      teamCreate(input, LEADER),
      { team: { create } },
      AFTER_TEAM_CLOSE
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses a caller who already belongs to a team', async (): Promise<void> => {
    const create = ok(TEAM_ID);

    const error = await failureAt(teamCreate(input, LEADER), {
      team: { create },
      membership: {
        findByUser: ok({ teamId: TEAM_ID, userId: LEADER.id, role: 'member' }),
      },
    });

    expect(error).toBeInstanceOf(EConflict);
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the team with the caller as leader and logs it', async (): Promise<void> => {
    const create = ok(TEAM_ID);
    const insert = ok(undefined);

    const team = await runAt(teamCreate(input, LEADER), {
      team: { create, findDetail: ok(detail) },
      insert,
    });

    expect(create).toHaveBeenCalledWith(input, {
      id: LEADER.id,
      email: LEADER.email,
    });
    expect(team.id).toBe(TEAM_ID);
    expect(team.members).toEqual([]);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.HACKATHON_TEAM_CREATE,
        resourceId: TEAM_ID,
      })
    );
  });
});
