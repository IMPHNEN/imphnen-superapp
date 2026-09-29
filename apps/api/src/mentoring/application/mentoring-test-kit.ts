import {
  MENTOR_STATUS,
  MENTORING_SESSION_STATUS,
  MENTORING_SESSION_TYPE,
} from '@app/schemas';
import { Effect, Layer } from 'effect';
import { type Mock, vi } from 'vitest';
import {
  MentorRepo,
  type TMentorRepoId,
  type TMentorRow,
} from '#/mentor/index.ts';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepo,
  type TMentoringSessionRepoId,
  type TMentoringSessionRow,
} from '#/mentoring/domain/mentoring-session.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';

export const SESSION_ID = '44444444-4444-4444-8444-444444444444';
export const MENTOR_USER_ID = '11111111-1111-4111-8111-111111111111';
export const MENTEE_ID = '55555555-5555-4555-8555-555555555555';
export const STRANGER_ID = '66666666-6666-4666-8666-666666666666';
export const HOUR_MS = 3_600_000;

export const sessionRowBuild = (
  overrides: Partial<TMentoringSessionRow> = {}
): TMentoringSessionRow => ({
  id: SESSION_ID,
  mentor: {
    mentorId: '33333333-3333-4333-8333-333333333333',
    userId: MENTOR_USER_ID,
    name: 'Mentor',
    email: 'mentor@test.app',
    image: null,
  },
  mentee: {
    userId: MENTEE_ID,
    name: 'Mentee',
    email: 'mentee@test.app',
    image: null,
  },
  topic: 'Backend',
  description: null,
  scheduledAt: new Date(Date.now() + HOUR_MS),
  durationMinutes: 60,
  sessionType: MENTORING_SESSION_TYPE.ONLINE,
  status: MENTORING_SESSION_STATUS.PENDING,
  meetingLink: null,
  feedback: null,
  rating: null,
  feedbackSubmittedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

export const activeMentor = {
  id: '33333333-3333-4333-8333-333333333333',
  userId: MENTOR_USER_ID,
  status: MENTOR_STATUS.ACTIVE,
  preferredMentoringFormats: [],
  availabilityCommitment: null,
} as unknown as TMentorRow;

export type TSessionMocks = {
  [TKey in keyof TMentoringSessionRepo]: Mock;
} & { insert: Mock; findMentor: Mock };

export const sessionMocksBuild = (
  found: TMentoringSessionRow | null,
  mentor: TMentorRow | null = activeMentor
): TSessionMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(found)),
  listFor: vi.fn(),
  manageList: vi.fn(),
  book: vi.fn().mockReturnValue(Effect.succeed(found)),
  change: vi.fn().mockReturnValue(Effect.succeed(found)),
  feedbackSet: vi.fn().mockReturnValue(Effect.succeed(found)),
  busy: vi.fn().mockReturnValue(Effect.succeed([])),
  mentorStats: vi.fn(),
  menteeList: vi.fn(),
  overview: vi.fn(),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  findMentor: vi.fn().mockReturnValue(Effect.succeed(mentor)),
});

export const sessionLayerBuild = (
  mocks: TSessionMocks
): Layer.Layer<TMentoringSessionRepoId | TMentorRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      MentoringSessionRepo,
      MentoringSessionRepo.of({
        findById: mocks.findById,
        listFor: mocks.listFor,
        manageList: mocks.manageList,
        book: mocks.book,
        change: mocks.change,
        feedbackSet: mocks.feedbackSet,
        busy: mocks.busy,
        mentorStats: mocks.mentorStats,
        menteeList: mocks.menteeList,
        overview: mocks.overview,
      })
    ),
    Layer.succeed(
      MentorRepo,
      MentorRepo.of({
        publicList: vi.fn(),
        reviewList: vi.fn(),
        findById: vi.fn(),
        findByUserId: mocks.findMentor,
        register: vi.fn(),
        update: vi.fn(),
        review: vi.fn(),
        remove: vi.fn(),
        documentKeySet: vi.fn(),
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );
