import {
  mentorPrivateSchema,
  mentorPublicSchema,
  type TMentorPrivate,
  type TMentorPublic,
} from '@app/schemas';
import type { TMentorRow } from '#/mentor/domain/mentor.ts';

const publicFields = (row: TMentorRow): TMentorPublic => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  image: row.image,
  bio: row.bio,
  lastEducation: row.lastEducation,
  location: row.location,
  linkedinUrl: row.linkedinUrl,
  githubUrl: row.githubUrl,
  portfolioUrl: row.portfolioUrl,
  twitterUrl: row.twitterUrl,
  industries: [...row.industries],
  expertise: [...row.expertise],
  languages: [...row.languages],
  currentCompany: row.currentCompany,
  currentRole: row.currentRole,
  yearsOfExperience: row.yearsOfExperience,
  topicsOfInterest: [...row.topicsOfInterest],
  preferredMenteeLevel: [...row.preferredMenteeLevel],
  preferredMentoringFormats: [...row.preferredMentoringFormats],
  availabilityCommitment: row.availabilityCommitment,
  mentoringRate: row.mentoringRate,
  ratingAverage: row.ratingAverage,
  ratingCount: row.ratingCount,
  completedSessionCount: row.completedSessionCount,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toMentorPublicDto = (row: TMentorRow): TMentorPublic =>
  mentorPublicSchema.parse(publicFields(row));

export const toMentorPrivateDto = (row: TMentorRow): TMentorPrivate =>
  mentorPrivateSchema.parse({
    ...publicFields(row),
    email: row.email,
    status: row.status,
    legalName: row.legalName,
    gender: row.gender,
    domicile: row.domicile,
    phoneNumber: row.phoneNumber,
    phoneForVerification: row.phoneForVerification,
    hasIdentityDocument: row.identityDocumentKey !== null,
    hasCv: row.cvKey !== null,
    cvLegacyUrl: row.cvLegacyUrl,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy,
  });
