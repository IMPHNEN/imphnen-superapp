import type { TMentorStatus } from '@app/schemas';
import {
  index,
  integer,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

const tagListColumn = (name: string) =>
  text(name, { mode: 'json' }).$type<string[]>().notNull().default([]);

export const mentor = sqliteTable(
  'mentor',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .unique()
      .references((): AnySQLiteColumn => user.id, { onDelete: 'cascade' }),
    status: text('status').$type<TMentorStatus>().notNull(),
    legalName: text('legal_name'),
    gender: text('gender'),
    domicile: text('domicile'),
    location: text('location'),
    phoneNumber: text('phone_number'),
    phoneForVerification: text('phone_for_verification'),
    bio: text('bio'),
    lastEducation: text('last_education'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    portfolioUrl: text('portfolio_url'),
    twitterUrl: text('twitter_url'),
    identityDocumentKey: text('identity_document_key'),
    cvKey: text('cv_key'),
    cvLegacyUrl: text('cv_legacy_url'),
    industries: tagListColumn('industries'),
    expertise: tagListColumn('expertise'),
    languages: tagListColumn('languages'),
    currentCompany: text('current_company'),
    currentRole: text('current_role'),
    yearsOfExperience: integer('years_of_experience'),
    topicsOfInterest: tagListColumn('topics_of_interest'),
    preferredMenteeLevel: tagListColumn('preferred_mentee_level'),
    preferredMentoringFormats: tagListColumn('preferred_mentoring_formats'),
    availabilityCommitment: text('availability_commitment'),
    mentoringRate: integer('mentoring_rate'),
    reviewNote: text('review_note'),
    reviewedAt: timestampColumn('reviewed_at'),
    reviewedBy: text('reviewed_by').references((): AnySQLiteColumn => user.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestampColumn('deleted_at'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index('mentor_status_idx').on(table.status, table.deletedAt),
    index('mentor_created_at_idx').on(table.createdAt),
  ]
);
