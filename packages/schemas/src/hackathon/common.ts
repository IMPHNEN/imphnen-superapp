import { HACKATHON_MESSAGE } from '@app/messages';
import { A, D } from '@mobily/ts-belt';
import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import {
  HACKATHON_IMAGE_EXTENSION,
  HACKATHON_LIMIT,
  HACKATHON_STORAGE_PREFIX,
} from './constants.ts';
import indonesianCities from './indonesian-cities.json' with { type: 'json' };

const PATTERN_ALTERNATION = '|';

const KEY_EXTENSIONS = A.join(
  A.uniq(D.values(HACKATHON_IMAGE_EXTENSION)),
  PATTERN_ALTERNATION
);

const storageKeySchema = (prefix: string): z.ZodString =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}[0-9a-f-]{36}\\.(${KEY_EXTENSIONS})$`),
      HACKATHON_MESSAGE.UPLOAD_KEY_INVALID
    );

export const hackathonTeamImageKeySchema = storageKeySchema(
  HACKATHON_STORAGE_PREFIX.TEAM
);

export const hackathonScreenshotKeySchema = storageKeySchema(
  HACKATHON_STORAGE_PREFIX.SUBMISSION
);

const CITY_NAMES: ReadonlySet<string> = new Set(
  A.map(indonesianCities as readonly string[], (city) => city.toLowerCase())
);

export const HACKATHON_CITIES: readonly string[] = indonesianCities;

export const isHackathonCity = (city: string): boolean =>
  CITY_NAMES.has(city.trim().toLowerCase());

export const hackathonCitySchema = z
  .string()
  .trim()
  .min(1)
  .refine(isHackathonCity, HACKATHON_MESSAGE.CITY_INVALID);

export const hackathonUrlSchema = z.url().max(HACKATHON_LIMIT.URL_MAX);

export const hackathonIdSchema = z.uuid();

export const hackathonPersonSchema = z.object({
  id: userIdSchema,
  name: z.string(),
  image: z.string().nullable(),
});
export type THackathonPerson = z.infer<typeof hackathonPersonSchema>;

export const hackathonContactSchema = z.object({
  email: z.email(),
  phoneNumber: z.string().nullable(),
});
export type THackathonContact = z.infer<typeof hackathonContactSchema>;

export const hackathonTeamRefSchema = z.object({
  id: hackathonIdSchema,
  name: z.string(),
  logoUrl: z.string().nullable(),
});
export type THackathonTeamRef = z.infer<typeof hackathonTeamRefSchema>;

export const hackathonIdInputSchema = z.object({ id: hackathonIdSchema });
export type THackathonIdInput = z.infer<typeof hackathonIdInputSchema>;

export const hackathonTeamIdInputSchema = z.object({
  teamId: hackathonIdSchema,
});
export type THackathonTeamIdInput = z.infer<typeof hackathonTeamIdInputSchema>;

export const hackathonDecisionInputSchema = z.object({
  id: hackathonIdSchema,
  accept: z.boolean(),
});
export type THackathonDecisionInput = z.infer<
  typeof hackathonDecisionInputSchema
>;
