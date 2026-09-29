import { z } from 'zod';
import { HACKATHON_UPLOAD_KIND } from './constants.ts';

export const hackathonUploadKindSchema = z.enum([
  HACKATHON_UPLOAD_KIND.TEAM_LOGO,
  HACKATHON_UPLOAD_KIND.TEAM_BANNER,
  HACKATHON_UPLOAD_KIND.SUBMISSION_SCREENSHOT,
]);

export const hackathonUploadInputSchema = z.object({
  kind: hackathonUploadKindSchema,
  file: z.file(),
});
export type THackathonUploadInput = z.infer<typeof hackathonUploadInputSchema>;

export const hackathonUploadSchema = z.object({
  key: z.string(),
  url: z.string(),
});
export type THackathonUpload = z.infer<typeof hackathonUploadSchema>;
