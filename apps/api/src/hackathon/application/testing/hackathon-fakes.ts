import { Effect, Layer } from 'effect';
import { TestClock } from 'effect/testing';
import { type Mock, vi } from 'vitest';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { TDomainError } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  InvitationRepo,
  type TInvitationRepo,
  type TInvitationRepoId,
} from '#/hackathon/domain/invitation-repo.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepo,
  type TJoinRequestRepoId,
} from '#/hackathon/domain/join-request-repo.ts';
import {
  MembershipRepo,
  type TMembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import {
  MessageRepo,
  type TMessageRepo,
  type TMessageRepoId,
} from '#/hackathon/domain/message-repo.ts';
import {
  SubmissionRepo,
  type TSubmissionRepo,
  type TSubmissionRepoId,
} from '#/hackathon/domain/submission-repo.ts';
import {
  TeamRepo,
  type TTeamRepo,
  type TTeamRepoId,
} from '#/hackathon/domain/team-repo.ts';
import {
  BEFORE_DEADLINES,
  STORAGE_BASE,
  teamRowBuild,
} from '#/hackathon/application/testing/hackathon-fixtures.ts';

export * from '#/hackathon/application/testing/hackathon-fixtures.ts';

const unexpected = (): Mock => vi.fn();

export const ok = (value: unknown): Mock =>
  vi.fn().mockReturnValue(Effect.succeed(value));

export type TFakes = {
  team?: Partial<TTeamRepo>;
  membership?: Partial<TMembershipRepo>;
  invitation?: Partial<TInvitationRepo>;
  joinRequest?: Partial<TJoinRequestRepo>;
  message?: Partial<TMessageRepo>;
  submission?: Partial<TSubmissionRepo>;
  put?: Mock;
  insert?: Mock;
};

export type TFakeServices =
  | TTeamRepoId
  | TMembershipRepoId
  | TInvitationRepoId
  | TJoinRequestRepoId
  | TMessageRepoId
  | TSubmissionRepoId
  | TStorageServiceId
  | TActivityRecorderId;

export const fakeLayer = (fakes: TFakes): Layer.Layer<TFakeServices> =>
  Layer.mergeAll(
    Layer.succeed(
      TeamRepo,
      TeamRepo.of({
        browse: unexpected(),
        find: ok(teamRowBuild()),
        findDetail: unexpected(),
        create: unexpected(),
        update: unexpected(),
        removeIfAlone: unexpected(),
        remove: unexpected(),
        ...fakes.team,
      })
    ),
    Layer.succeed(
      MembershipRepo,
      MembershipRepo.of({
        findByUser: ok(null),
        findByEmail: ok(null),
        teamState: ok({ exists: true, memberCount: 1, hasSubmission: false }),
        removeMember: unexpected(),
        ...fakes.membership,
      })
    ),
    Layer.succeed(
      InvitationRepo,
      InvitationRepo.of({
        create: unexpected(),
        find: unexpected(),
        listPending: unexpected(),
        accept: unexpected(),
        reject: unexpected(),
        ...fakes.invitation,
      })
    ),
    Layer.succeed(
      JoinRequestRepo,
      JoinRequestRepo.of({
        create: unexpected(),
        find: unexpected(),
        listByUser: unexpected(),
        listPendingByTeam: unexpected(),
        accept: unexpected(),
        reject: unexpected(),
        ...fakes.joinRequest,
      })
    ),
    Layer.succeed(
      MessageRepo,
      MessageRepo.of({
        list: unexpected(),
        find: unexpected(),
        create: unexpected(),
        remove: unexpected(),
        ...fakes.message,
      })
    ),
    Layer.succeed(
      SubmissionRepo,
      SubmissionRepo.of({
        findByTeam: unexpected(),
        find: unexpected(),
        create: unexpected(),
        updateDraft: unexpected(),
        transition: unexpected(),
        ...fakes.submission,
      })
    ),
    Layer.succeed(
      StorageService,
      StorageService.of({
        put: fakes.put ?? unexpected(),
        remove: unexpected(),
        get: unexpected(),
        publicUrlOf: (key: string): string => `${STORAGE_BASE}${key}`,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: fakes.insert ?? ok(undefined) })
    )
  );

export const runAt = <TValue>(
  effect: Effect.Effect<TValue, TDomainError, TFakeServices>,
  fakes: TFakes,
  at: number = BEFORE_DEADLINES
): Promise<TValue> =>
  Effect.runPromise(
    TestClock.setTime(at).pipe(
      Effect.andThen(effect),
      Effect.provide(Layer.merge(fakeLayer(fakes), TestClock.layer()))
    )
  );

export const failureAt = <TValue>(
  effect: Effect.Effect<TValue, TDomainError, TFakeServices>,
  fakes: TFakes,
  at: number = BEFORE_DEADLINES
): Promise<TDomainError> =>
  Effect.runPromise(
    TestClock.setTime(at).pipe(
      Effect.andThen(effect),
      Effect.flip,
      Effect.provide(Layer.merge(fakeLayer(fakes), TestClock.layer()))
    )
  );
