import {
  HACKATHON_LIMIT,
  HACKATHON_SUBMISSION_STATUS,
  type THackathonSubmissionCreateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { EConflict, type EDatabase } from '#/shared/errors.ts';
import type {
  TCertificateRow,
  TSubmissionRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import {
  CertificateRepo,
  type TCertificateRepoId,
} from '#/hackathon/domain/award-repo.ts';
import { InvitationRepo } from '#/hackathon/domain/invitation-repo.ts';
import { JOIN_OUTCOME } from '#/hackathon/domain/join-outcome.ts';
import { MembershipRepo } from '#/hackathon/domain/membership-repo.ts';
import {
  SubmissionRepo,
  type TSubmissionRepoId,
} from '#/hackathon/domain/submission-repo.ts';
import { seededDbCreate } from '#/hackathon/infrastructure/testing/seed.ts';
import {
  invite,
  inviteAndAccept,
  memberCount,
  teamOf,
} from '#/hackathon/infrastructure/testing/team-fixtures.ts';

const draftOf = (teamId: string): THackathonSubmissionCreateInput => ({
  teamId,
  projectName: 'Enggan Ngoding',
  description: 'Deskripsi',
  repositoryUrl: 'https://github.com/imphnen/enggan',
  screenshotKeys: [],
});

const create = (
  teamId: string,
  leaderId: string
): Effect.Effect<
  TSubmissionRow | null,
  EDatabase | EConflict,
  TSubmissionRepoId
> =>
  SubmissionRepo.use((repo) =>
    repo.create(draftOf(teamId), leaderId, HACKATHON_LIMIT.SUBMIT_MIN_MEMBERS)
  );

describe('submission invariants on D1', () => {
  it('needs the minimum team size to open a submission', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);

    const alone = await seeded.run(create(teamId, leader));
    await inviteAndAccept(seeded, teamId, leader, member);
    const paired = await seeded.run(create(teamId, leader));

    expect(alone).toBeNull();
    expect(paired?.status).toBe(HACKATHON_SUBMISSION_STATUS.DRAFT);
    expect(await seeded.fail(create(teamId, leader))).toBeInstanceOf(EConflict);
  });

  it('locks membership once a submission exists', async (): Promise<void> => {
    const seeded = await seededDbCreate(3);
    const [leader = '', member = '', late = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);
    const invitation = await seeded.run(invite(teamId, leader, late));
    await seeded.run(create(teamId, leader));

    const joined = await seeded.run(
      InvitationRepo.use((repo) => repo.accept(invitation, late))
    );
    const left = await seeded.run(
      MembershipRepo.use((repo) => repo.removeMember(teamId, member))
    );

    expect(joined).toBe(JOIN_OUTCOME.TEAM_LOCKED);
    expect(left).toBe(false);
    expect(await memberCount(seeded, teamId)).toBe(2);
  });

  it('moves through draft, pending and submitted exactly once each', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);
    const draft = await seeded.run(create(teamId, leader));
    const id = draft?.id ?? '';
    const step = (
      from:
        | typeof HACKATHON_SUBMISSION_STATUS.DRAFT
        | typeof HACKATHON_SUBMISSION_STATUS.PENDING,
      to:
        | typeof HACKATHON_SUBMISSION_STATUS.PENDING
        | typeof HACKATHON_SUBMISSION_STATUS.SUBMITTED
    ): Effect.Effect<TSubmissionRow | null, EDatabase, TSubmissionRepoId> =>
      SubmissionRepo.use((repo) =>
        repo.transition({
          id,
          from: [from],
          to,
          minMembers: HACKATHON_LIMIT.SUBMIT_MIN_MEMBERS,
          stampSubmittedAt: to === HACKATHON_SUBMISSION_STATUS.SUBMITTED,
        })
      );

    const pending = await seeded.run(
      step(
        HACKATHON_SUBMISSION_STATUS.DRAFT,
        HACKATHON_SUBMISSION_STATUS.PENDING
      )
    );
    const [confirmed, again] = await seeded.run(
      Effect.all([
        step(
          HACKATHON_SUBMISSION_STATUS.PENDING,
          HACKATHON_SUBMISSION_STATUS.SUBMITTED
        ),
        step(
          HACKATHON_SUBMISSION_STATUS.PENDING,
          HACKATHON_SUBMISSION_STATUS.SUBMITTED
        ),
      ])
    );
    const edited = await seeded.run(
      SubmissionRepo.use((repo) =>
        repo.updateDraft({ id, projectName: 'Diubah' })
      )
    );

    expect(pending?.status).toBe(HACKATHON_SUBMISSION_STATUS.PENDING);
    expect(confirmed?.submittedAt).toBeInstanceOf(Date);
    expect(again).toBeNull();
    expect(edited).toBeNull();
  });

  it('issues a verifiable certificate only for a confirmed submission', async (): Promise<void> => {
    const seeded = await seededDbCreate(2);
    const [leader = '', member = ''] = seeded.users;
    const teamId = await teamOf(seeded, leader);
    await inviteAndAccept(seeded, teamId, leader, member);
    const draft = await seeded.run(create(teamId, leader));
    const certificateOf = (): Effect.Effect<
      TCertificateRow | null,
      EDatabase,
      TCertificateRepoId
    > => CertificateRepo.use((repo) => repo.findByUser(member));

    const before = await seeded.run(certificateOf());
    await seeded.run(
      SubmissionRepo.use((repo) =>
        repo.transition({
          id: draft?.id ?? '',
          from: [HACKATHON_SUBMISSION_STATUS.DRAFT],
          to: HACKATHON_SUBMISSION_STATUS.SUBMITTED,
          minMembers: 0,
          stampSubmittedAt: true,
        })
      )
    );
    const after = await seeded.run(certificateOf());
    const verified = await seeded.run(
      CertificateRepo.use((repo) => repo.find(after?.id ?? ''))
    );

    expect(before).toBeNull();
    expect(after?.projectName).toBe('Enggan Ngoding');
    expect(verified?.userId).toBe(member);
  });
});
