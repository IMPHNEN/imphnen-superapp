import { z } from 'zod';

export const PROFILE_LIMIT = {
  SHORT_TEXT: 100,
  BIO: 2000,
  URL: 2048,
  SKILLS: 50,
  HISTORY: 30,
} as const;

const shortText = z.string().max(PROFILE_LIMIT.SHORT_TEXT);

const nullableShortText = shortText.nullable();

const nullableUrlInput = z.url().max(PROFILE_LIMIT.URL).nullable();

export const experienceSchema = z.object({
  id: shortText,
  company: shortText,
  position: shortText,
  duration: shortText,
  period: shortText,
});
export type TExperience = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  id: shortText,
  institution: shortText,
  degree: shortText,
  field: shortText,
  period: shortText,
});
export type TEducation = z.infer<typeof educationSchema>;

export const profileExtensionSchema = z.object({
  phoneNumber: z.string().nullable(),
  phoneForVerification: z.string().nullable(),
  gender: z.string().nullable(),
  birthdate: z.string().nullable(),
  domicile: z.string().nullable(),
  bio: z.string().nullable(),
  lastEducation: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  cvUrl: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  twitterUrl: z.string().nullable(),
  location: z.string().nullable(),
  skills: z.array(z.string()),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  careerStatus: z.string().nullable(),
});
export type TProfileExtension = z.infer<typeof profileExtensionSchema>;

export const profileExtensionPatchSchema = z
  .object({
    phoneNumber: nullableShortText,
    phoneForVerification: nullableShortText,
    gender: nullableShortText,
    birthdate: nullableShortText,
    domicile: nullableShortText,
    bio: z.string().max(PROFILE_LIMIT.BIO).nullable(),
    lastEducation: nullableShortText,
    linkedinUrl: nullableUrlInput,
    githubUrl: nullableUrlInput,
    cvUrl: nullableUrlInput,
    portfolioUrl: nullableUrlInput,
    websiteUrl: nullableUrlInput,
    twitterUrl: nullableUrlInput,
    location: nullableShortText,
    skills: z.array(shortText).max(PROFILE_LIMIT.SKILLS),
    experience: z.array(experienceSchema).max(PROFILE_LIMIT.HISTORY),
    education: z.array(educationSchema).max(PROFILE_LIMIT.HISTORY),
    careerStatus: nullableShortText,
  })
  .partial();
export type TProfileExtensionPatch = z.infer<
  typeof profileExtensionPatchSchema
>;
