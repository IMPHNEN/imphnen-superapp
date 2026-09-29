import type {
  TMentorListInput,
  TMentorProfilePatch,
  TMentorRegisterInput,
  TMentorReviewInput,
  TMentorReviewListInput,
  TMentorDocumentKind,
  TMentorStatus,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TMentorRow = TBaseRow & {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  status: TMentorStatus;
  legalName: string | null;
  gender: string | null;
  domicile: string | null;
  location: string | null;
  phoneNumber: string | null;
  phoneForVerification: string | null;
  bio: string | null;
  lastEducation: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  twitterUrl: string | null;
  identityDocumentKey: string | null;
  cvKey: string | null;
  cvLegacyUrl: string | null;
  industries: readonly string[];
  expertise: readonly string[];
  languages: readonly string[];
  currentCompany: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  topicsOfInterest: readonly string[];
  preferredMenteeLevel: readonly string[];
  preferredMentoringFormats: readonly string[];
  availabilityCommitment: string | null;
  mentoringRate: number | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  completedSessionCount: number;
};

export type TMentorRepo = {
  publicList: (
    input: TMentorListInput
  ) => Effect.Effect<TRowPage<TMentorRow>, EDatabase>;
  reviewList: (
    input: TMentorReviewListInput
  ) => Effect.Effect<TRowPage<TMentorRow>, EDatabase>;
  findById: (id: string) => Effect.Effect<TMentorRow | null, EDatabase>;
  findByUserId: (userId: string) => Effect.Effect<TMentorRow | null, EDatabase>;
  register: (
    input: TMentorRegisterInput,
    userId: string
  ) => Effect.Effect<TMentorRow | null, EDatabase>;
  update: (
    id: string,
    patch: TMentorProfilePatch
  ) => Effect.Effect<TMentorRow | null, EDatabase>;
  review: (
    input: TMentorReviewInput,
    reviewerId: string
  ) => Effect.Effect<TMentorRow | null, EDatabase>;
  remove: (id: string) => Effect.Effect<boolean, EDatabase>;
  documentKeySet: (
    id: string,
    kind: TMentorDocumentKind,
    key: string
  ) => Effect.Effect<TMentorRow | null, EDatabase>;
};

export type TMentorRepoId = TServiceId<typeof REPO_TAG.MENTOR>;

export const MentorRepo = Context.Service<TMentorRepoId, TMentorRepo>(
  REPO_TAG.MENTOR
);
