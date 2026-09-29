import { z } from 'zod';

export const MENTOR_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  INACTIVE: 'inactive',
} as const;

export type TMentorStatus = (typeof MENTOR_STATUS)[keyof typeof MENTOR_STATUS];

export const mentorStatusSchema = z.enum([
  MENTOR_STATUS.PENDING,
  MENTOR_STATUS.ACTIVE,
  MENTOR_STATUS.REJECTED,
  MENTOR_STATUS.INACTIVE,
]);

export const MENTOR_REVIEW_DECISION = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

export type TMentorReviewDecision =
  (typeof MENTOR_REVIEW_DECISION)[keyof typeof MENTOR_REVIEW_DECISION];

export const MENTOR_DOCUMENT_KIND = {
  CV: 'cv',
  IDENTITY: 'identity',
} as const;

export type TMentorDocumentKind =
  (typeof MENTOR_DOCUMENT_KIND)[keyof typeof MENTOR_DOCUMENT_KIND];

export const mentorDocumentKindSchema = z.enum([
  MENTOR_DOCUMENT_KIND.CV,
  MENTOR_DOCUMENT_KIND.IDENTITY,
]);

export const MENTOR_SORT = {
  RATING: 'rating',
  SESSIONS: 'sessions',
  YEARS_OF_EXPERIENCE: 'yearsOfExperience',
  CREATED_AT: 'createdAt',
} as const;

export type TMentorSort = (typeof MENTOR_SORT)[keyof typeof MENTOR_SORT];

export const MENTOR_REVIEW_SORT = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type TMentorReviewSort =
  (typeof MENTOR_REVIEW_SORT)[keyof typeof MENTOR_REVIEW_SORT];

export const MENTOR_LIMIT = {
  TEXT_MAX: 200,
  LEGAL_NAME_MIN: 3,
  BIO_MIN: 50,
  BIO_MAX: 2000,
  PHONE_MIN: 10,
  PHONE_MAX: 15,
  YEARS_MIN: 2,
  YEARS_MAX: 60,
  AVAILABILITY_MIN: 5,
  RATE_MIN: 1,
  RATE_MAX: 100_000_000,
  TAG_MAX: 100,
  TAGS_MAX: 30,
  REVIEW_NOTE_MAX: 1000,
} as const;
