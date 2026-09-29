import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated } from '../shared/pagination.ts';
import { mentorStatusSchema } from './mentor-constants.ts';

const nullableText = z.string().nullable();
const tagList = z.array(z.string());

export const mentorPublicSchema = baseSchema(z.uuid()).extend({
  userId: userIdSchema,
  name: z.string(),
  image: nullableText,
  bio: nullableText,
  lastEducation: nullableText,
  location: nullableText,
  linkedinUrl: nullableText,
  githubUrl: nullableText,
  portfolioUrl: nullableText,
  twitterUrl: nullableText,
  industries: tagList,
  expertise: tagList,
  languages: tagList,
  currentCompany: nullableText,
  currentRole: nullableText,
  yearsOfExperience: z.number().int().nullable(),
  topicsOfInterest: tagList,
  preferredMenteeLevel: tagList,
  preferredMentoringFormats: tagList,
  availabilityCommitment: nullableText,
  mentoringRate: z.number().int().nullable(),
  ratingAverage: z.number().nullable(),
  ratingCount: z.number().int().min(0),
  completedSessionCount: z.number().int().min(0),
});
export type TMentorPublic = TEntityOf<z.infer<typeof mentorPublicSchema>>;

export const mentorPrivateSchema = mentorPublicSchema.extend({
  email: z.email(),
  status: mentorStatusSchema,
  legalName: nullableText,
  gender: nullableText,
  domicile: nullableText,
  phoneNumber: nullableText,
  phoneForVerification: nullableText,
  hasIdentityDocument: z.boolean(),
  hasCv: z.boolean(),
  cvLegacyUrl: nullableText,
  reviewNote: nullableText,
  reviewedAt: z.iso.datetime().nullable(),
  reviewedBy: userIdSchema.nullable(),
});
export type TMentorPrivate = TEntityOf<z.infer<typeof mentorPrivateSchema>>;

export const mentorMeSchema = mentorPrivateSchema.nullable();
export type TMentorMe = z.infer<typeof mentorMeSchema>;

export const mentorPublicListSchema = paginated(mentorPublicSchema);
export type TMentorPublicList = z.infer<typeof mentorPublicListSchema>;

export const mentorPrivateListSchema = paginated(mentorPrivateSchema);
export type TMentorPrivateList = z.infer<typeof mentorPrivateListSchema>;

export const mentorRemovedSchema = z.object({ id: z.uuid() });
export type TMentorRemoved = z.infer<typeof mentorRemovedSchema>;

export const mentorDocumentSchema = z.file();
