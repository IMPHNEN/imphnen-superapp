import type { TEducation, TExperience } from '@app/schemas';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const userProfile = sqliteTable('user_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  avatarKey: text('avatar_key'),
  phoneNumber: text('phone_number'),
  phoneForVerification: text('phone_for_verification'),
  gender: text('gender'),
  birthdate: text('birthdate'),
  domicile: text('domicile'),
  bio: text('bio'),
  lastEducation: text('last_education'),
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  cvUrl: text('cv_url'),
  portfolioUrl: text('portfolio_url'),
  websiteUrl: text('website_url'),
  twitterUrl: text('twitter_url'),
  location: text('location'),
  skills: text('skills', { mode: 'json' })
    .$type<readonly string[]>()
    .notNull()
    .default([]),
  experience: text('experience', { mode: 'json' })
    .$type<readonly TExperience[]>()
    .notNull()
    .default([]),
  education: text('education', { mode: 'json' })
    .$type<readonly TEducation[]>()
    .notNull()
    .default([]),
  careerStatus: text('career_status'),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
