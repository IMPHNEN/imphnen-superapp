import {
  profileSchema,
  type TProfile,
  type TProfileExtension,
} from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type {
  TProfileExtensionRow,
  TProfileRow,
} from '#/profile/domain/profile.ts';

const AVATAR_KEY_FIELD = 'avatarKey';

const EMPTY_EXTENSION: TProfileExtension = {
  phoneNumber: null,
  phoneForVerification: null,
  gender: null,
  birthdate: null,
  domicile: null,
  bio: null,
  lastEducation: null,
  linkedinUrl: null,
  githubUrl: null,
  cvUrl: null,
  portfolioUrl: null,
  websiteUrl: null,
  twitterUrl: null,
  location: null,
  skills: [],
  experience: [],
  education: [],
  careerStatus: null,
};

const extensionOf = (row: TProfileExtensionRow | null): TProfileExtension =>
  match(row)
    .with(P.nullish, (): TProfileExtension => EMPTY_EXTENSION)
    .otherwise(
      (found): TProfileExtension => ({
        ...D.deleteKey(found, AVATAR_KEY_FIELD),
        skills: [...found.skills],
        experience: [...found.experience],
        education: [...found.education],
      })
    );

export const toProfileDto = (row: TProfileRow): TProfile =>
  profileSchema.parse({
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    emailVerified: row.user.emailVerified,
    image: row.user.image,
    role: row.user.role,
    extension: extensionOf(row.extension),
    createdAt: row.user.createdAt.toISOString(),
    updatedAt: row.user.updatedAt.toISOString(),
  });
