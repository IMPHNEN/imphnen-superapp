import { MENTOR_STATUS } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { type Mock, vi } from 'vitest';
import {
  MentorRepo,
  type TMentorRepo,
  type TMentorRepoId,
  type TMentorRow,
} from '#/mentor/domain/mentor.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';

export const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
export const MENTOR_USER_ID = '11111111-1111-4111-8111-111111111111';
export const MENTOR_ID = '33333333-3333-4333-8333-333333333333';

export const mentorRowBuild = (
  overrides: Partial<TMentorRow> = {}
): TMentorRow => ({
  id: MENTOR_ID,
  userId: MENTOR_USER_ID,
  name: 'Mentor',
  email: 'mentor@test.app',
  image: null,
  status: MENTOR_STATUS.PENDING,
  legalName: 'Mentor Legal',
  gender: null,
  domicile: null,
  location: null,
  phoneNumber: null,
  phoneForVerification: null,
  bio: 'b'.repeat(60),
  lastEducation: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  twitterUrl: null,
  identityDocumentKey: null,
  cvKey: null,
  cvLegacyUrl: null,
  industries: [],
  expertise: ['Rust'],
  languages: [],
  currentCompany: 'Company',
  currentRole: 'Engineer',
  yearsOfExperience: 5,
  topicsOfInterest: [],
  preferredMenteeLevel: [],
  preferredMentoringFormats: [],
  availabilityCommitment: 'Weekends',
  mentoringRate: 100_000,
  reviewNote: null,
  reviewedAt: null,
  reviewedBy: null,
  ratingAverage: null,
  ratingCount: 0,
  completedSessionCount: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

export type TMentorMocks = { [TKey in keyof TMentorRepo]: Mock } & {
  insert: Mock;
  storagePut: Mock;
  storageRemove: Mock;
  storageGet: Mock;
};

export const mentorMocksBuild = (found: TMentorRow | null): TMentorMocks => ({
  publicList: vi.fn(),
  reviewList: vi.fn(),
  findById: vi.fn().mockReturnValue(Effect.succeed(found)),
  findByUserId: vi.fn().mockReturnValue(Effect.succeed(found)),
  register: vi.fn().mockReturnValue(Effect.succeed(found)),
  update: vi.fn().mockReturnValue(Effect.succeed(found)),
  review: vi.fn().mockReturnValue(Effect.succeed(found)),
  documentKeySet: vi.fn().mockReturnValue(Effect.succeed(found)),
  remove: vi.fn().mockReturnValue(Effect.succeed(true)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  storagePut: vi.fn().mockReturnValue(Effect.succeed(MENTOR_ID)),
  storageRemove: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  storageGet: vi.fn().mockReturnValue(Effect.succeed(null)),
});

export const mentorLayerBuild = (
  mocks: TMentorMocks
): Layer.Layer<TMentorRepoId | TActivityRecorderId | TStorageServiceId> =>
  Layer.mergeAll(
    Layer.succeed(
      MentorRepo,
      MentorRepo.of({
        publicList: mocks.publicList,
        reviewList: mocks.reviewList,
        findById: mocks.findById,
        findByUserId: mocks.findByUserId,
        register: mocks.register,
        update: mocks.update,
        review: mocks.review,
        remove: mocks.remove,
        documentKeySet: mocks.documentKeySet,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    ),
    Layer.succeed(
      StorageService,
      StorageService.of({
        put: mocks.storagePut,
        remove: mocks.storageRemove,
        get: mocks.storageGet,
        publicUrlOf: (key: string): string => key,
      })
    )
  );
