import { HACKATHON_MESSAGE } from '@app/messages';
import { HACKATHON_LIMIT, HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { EBadRequest, EForbidden } from '#/shared/errors.ts';
import type { TSubmissionRow } from '#/hackathon/domain/hackathon-rows.ts';
import { submissionCancel } from '#/hackathon/application/submission-cancel.ts';
import { submissionCreate } from '#/hackathon/application/submission-create.ts';
import { submissionGet } from '#/hackathon/application/submission-get.ts';
import { submissionSubmit } from '#/hackathon/application/submission-submit.ts';
import {
  AFTER_SUBMISSION_CLOSE,
  failureAt,
  LEADER,
  OUTSIDER,
  ok,
  runAt,
  STORAGE_BASE,
  TEAM_ID,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const SUBMISSION_ID = '99999999-9999-4999-8999-999999999999';
const SCREENSHOT =
  'hackathon/submission/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png';

const draft: TSubmissionRow = {
  id: SUBMISSION_ID,
  teamId: TEAM_ID,
  projectName: 'Enggan Ngoding',
  description: 'Deskripsi',
  repositoryUrl: 'https://github.com/imphnen/enggan',
  demoUrl: null,
  presentationUrl: null,
  videoUrl: null,
  screenshotKeys: [SCREENSHOT],
  status: HACKATHON_SUBMISSION_STATUS.DRAFT,
  submittedAt: null,
  createdBy: LEADER.id,
  createdAt: new Date('2025-11-01T00:00:00Z'),
  updatedAt: new Date('2025-11-01T00:00:00Z'),
};

const createInput = {
  teamId: TEAM_ID,
  projectName: draft.projectName,
  description: draft.description,
  repositoryUrl: draft.repositoryUrl,
  screenshotKeys: [SCREENSHOT],
};

describe('submissionCreate', () => {
  it('asks the store for the minimum team size and reports a refusal', async (): Promise<void> => {
    const create = ok(null);

    const error = await failureAt(submissionCreate(createInput, LEADER.id), {
      submission: { create },
    });

    expect(create).toHaveBeenCalledWith(
      createInput,
      LEADER.id,
      HACKATHON_LIMIT.SUBMIT_MIN_MEMBERS
    );
    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.SUBMISSION_TOO_FEW_MEMBERS,
    });
  });

  it('refuses after the submission deadline', async (): Promise<void> => {
    const error = await failureAt(
      submissionCreate(createInput, LEADER.id),
      { submission: { create: ok(draft) } },
      AFTER_SUBMISSION_CLOSE
    );

    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.SUBMISSION_CLOSED,
    });
  });

  it('returns public screenshot URLs next to their keys', async (): Promise<void> => {
    const created = await runAt(submissionCreate(createInput, LEADER.id), {
      submission: { create: ok(draft) },
    });

    expect(created.screenshots).toEqual([
      { key: SCREENSHOT, url: `${STORAGE_BASE}${SCREENSHOT}` },
    ]);
  });
});

describe('submission transitions', () => {
  it('only submits a draft', async (): Promise<void> => {
    const transition = ok(draft);

    const error = await failureAt(
      submissionSubmit({ id: SUBMISSION_ID }, LEADER.id),
      {
        submission: {
          find: ok({ ...draft, status: HACKATHON_SUBMISSION_STATUS.PENDING }),
          transition,
        },
      }
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(transition).not.toHaveBeenCalled();
  });

  it('reports too few members when the guarded update refuses', async (): Promise<void> => {
    const error = await failureAt(
      submissionSubmit({ id: SUBMISSION_ID }, LEADER.id),
      { submission: { find: ok(draft), transition: ok(null) } }
    );

    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.SUBMISSION_TOO_FEW_MEMBERS,
    });
  });

  it('never cancels a confirmed submission', async (): Promise<void> => {
    const error = await failureAt(
      submissionCancel({ id: SUBMISSION_ID }, LEADER.id),
      {
        submission: {
          find: ok({ ...draft, status: HACKATHON_SUBMISSION_STATUS.SUBMITTED }),
        },
      }
    );

    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.SUBMISSION_CONFIRMED,
    });
  });

  it('lets only the leader move a submission', async (): Promise<void> => {
    const error = await failureAt(
      submissionSubmit({ id: SUBMISSION_ID }, OUTSIDER.id),
      { submission: { find: ok(draft) } }
    );

    expect(error).toBeInstanceOf(EForbidden);
  });
});

describe('submissionGet', () => {
  it('shows the submission to managers but not to outsiders', async (): Promise<void> => {
    const fakes = { submission: { findByTeam: ok(draft) } };

    const error = await failureAt(
      submissionGet(
        { teamId: TEAM_ID },
        { userId: OUTSIDER.id, canManage: false }
      ),
      fakes
    );
    const managed = await runAt(
      submissionGet(
        { teamId: TEAM_ID },
        { userId: OUTSIDER.id, canManage: true }
      ),
      fakes
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(managed?.id).toBe(SUBMISSION_ID);
  });
});
