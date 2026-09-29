import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';
import {
  MENTOR_LIMIT,
  MENTOR_REVIEW_DECISION,
  MENTOR_REVIEW_SORT,
  MENTOR_SORT,
  mentorDocumentKindSchema,
  mentorStatusSchema,
} from './mentor-constants.ts';

const HTTP_PROTOCOL = /^https?$/;

export const mentorIdSchema = z.uuid();

const requiredText = z.string().trim().min(1).max(MENTOR_LIMIT.TEXT_MAX);
const optionalText = requiredText.nullable().optional();
const optionalUrl = z.url({ protocol: HTTP_PROTOCOL }).nullable().optional();
const optionalPhone = z
  .string()
  .trim()
  .min(MENTOR_LIMIT.PHONE_MIN)
  .max(MENTOR_LIMIT.PHONE_MAX)
  .nullable()
  .optional();
const tagList = z
  .array(z.string().trim().min(1).max(MENTOR_LIMIT.TAG_MAX))
  .max(MENTOR_LIMIT.TAGS_MAX);

export const mentorProfileInputSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(MENTOR_LIMIT.LEGAL_NAME_MIN)
    .max(MENTOR_LIMIT.TEXT_MAX),
  gender: optionalText,
  domicile: optionalText,
  location: optionalText,
  phoneNumber: optionalPhone,
  phoneForVerification: optionalPhone,
  bio: z.string().trim().min(MENTOR_LIMIT.BIO_MIN).max(MENTOR_LIMIT.BIO_MAX),
  lastEducation: optionalText,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  twitterUrl: optionalUrl,
  industries: tagList,
  expertise: tagList,
  languages: tagList,
  currentCompany: requiredText,
  currentRole: requiredText,
  yearsOfExperience: z
    .number()
    .int()
    .min(MENTOR_LIMIT.YEARS_MIN)
    .max(MENTOR_LIMIT.YEARS_MAX),
  topicsOfInterest: tagList,
  preferredMenteeLevel: tagList,
  preferredMentoringFormats: tagList,
  availabilityCommitment: z
    .string()
    .trim()
    .min(MENTOR_LIMIT.AVAILABILITY_MIN)
    .max(MENTOR_LIMIT.TEXT_MAX),
  mentoringRate: z
    .number()
    .int()
    .min(MENTOR_LIMIT.RATE_MIN)
    .max(MENTOR_LIMIT.RATE_MAX),
});
export type TMentorProfileInput = z.infer<typeof mentorProfileInputSchema>;

export const mentorRegisterInputSchema = mentorProfileInputSchema;
export type TMentorRegisterInput = z.infer<typeof mentorRegisterInputSchema>;

export const mentorProfilePatchSchema = mentorProfileInputSchema.partial();
export type TMentorProfilePatch = z.infer<typeof mentorProfilePatchSchema>;

export const mentorUpdateInputSchema = mentorProfilePatchSchema.extend({
  id: mentorIdSchema,
});
export type TMentorUpdateInput = z.infer<typeof mentorUpdateInputSchema>;

export const mentorIdInputSchema = z.object({ id: mentorIdSchema });
export type TMentorIdInput = z.infer<typeof mentorIdInputSchema>;

export const mentorUserIdInputSchema = z.object({ userId: userIdSchema });
export type TMentorUserIdInput = z.infer<typeof mentorUserIdInputSchema>;

export const mentorReviewInputSchema = z.object({
  id: mentorIdSchema,
  decision: z.enum([
    MENTOR_REVIEW_DECISION.APPROVE,
    MENTOR_REVIEW_DECISION.REJECT,
  ]),
  note: z.string().trim().min(1).max(MENTOR_LIMIT.REVIEW_NOTE_MAX).optional(),
});
export type TMentorReviewInput = z.infer<typeof mentorReviewInputSchema>;

export const mentorDocumentUploadInputSchema = z.object({
  kind: mentorDocumentKindSchema,
  file: z.file(),
});
export type TMentorDocumentUploadInput = z.infer<
  typeof mentorDocumentUploadInputSchema
>;

export const mentorDocumentDownloadInputSchema = z.object({
  id: mentorIdSchema,
  kind: mentorDocumentKindSchema,
});
export type TMentorDocumentDownloadInput = z.infer<
  typeof mentorDocumentDownloadInputSchema
>;

export const mentorListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  expertise: z.string().trim().min(1).max(MENTOR_LIMIT.TAG_MAX).optional(),
  industry: z.string().trim().min(1).max(MENTOR_LIMIT.TAG_MAX).optional(),
  sortBy: z
    .enum([
      MENTOR_SORT.RATING,
      MENTOR_SORT.SESSIONS,
      MENTOR_SORT.YEARS_OF_EXPERIENCE,
      MENTOR_SORT.CREATED_AT,
    ])
    .default(MENTOR_SORT.RATING),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TMentorListInput = z.infer<typeof mentorListInputSchema>;

export const mentorReviewListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  status: mentorStatusSchema.optional(),
  sortBy: z
    .enum([MENTOR_REVIEW_SORT.CREATED_AT, MENTOR_REVIEW_SORT.UPDATED_AT])
    .default(MENTOR_REVIEW_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TMentorReviewListInput = z.infer<
  typeof mentorReviewListInputSchema
>;
