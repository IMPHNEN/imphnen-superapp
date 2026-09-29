import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import {
  hackathonIdSchema,
  hackathonScreenshotKeySchema,
  hackathonTeamRefSchema,
  hackathonUrlSchema,
} from './common.ts';
import { HACKATHON_LIMIT, HACKATHON_SUBMISSION_STATUS } from './constants.ts';

export const hackathonSubmissionStatusSchema = z.enum([
  HACKATHON_SUBMISSION_STATUS.DRAFT,
  HACKATHON_SUBMISSION_STATUS.PENDING,
  HACKATHON_SUBMISSION_STATUS.SUBMITTED,
]);

export const hackathonStoredFileSchema = z.object({
  key: z.string(),
  url: z.string(),
});
export type THackathonStoredFile = z.infer<typeof hackathonStoredFileSchema>;

export const hackathonSubmissionSchema = baseSchema(hackathonIdSchema).extend({
  teamId: hackathonIdSchema,
  projectName: z.string(),
  description: z.string(),
  repositoryUrl: z.string(),
  demoUrl: z.string().nullable(),
  presentationUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  screenshots: z.array(hackathonStoredFileSchema).readonly(),
  status: hackathonSubmissionStatusSchema,
  submittedAt: z.iso.datetime().nullable(),
  createdBy: userIdSchema.nullable(),
});
export type THackathonSubmission = z.infer<typeof hackathonSubmissionSchema>;

const projectNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(HACKATHON_LIMIT.NAME_MAX);
const descriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(HACKATHON_LIMIT.TEXT_MAX);
const screenshotsSchema = z
  .array(hackathonScreenshotKeySchema)
  .max(HACKATHON_LIMIT.SCREENSHOTS_MAX);

export const hackathonSubmissionCreateInputSchema = z.object({
  teamId: hackathonIdSchema,
  projectName: projectNameSchema,
  description: descriptionSchema,
  repositoryUrl: hackathonUrlSchema,
  demoUrl: hackathonUrlSchema.optional(),
  presentationUrl: hackathonUrlSchema.optional(),
  videoUrl: hackathonUrlSchema.optional(),
  screenshotKeys: screenshotsSchema.default([]),
});
export type THackathonSubmissionCreateInput = z.infer<
  typeof hackathonSubmissionCreateInputSchema
>;

export const hackathonSubmissionUpdateInputSchema = z.object({
  id: hackathonIdSchema,
  projectName: projectNameSchema.optional(),
  description: descriptionSchema.optional(),
  repositoryUrl: hackathonUrlSchema.optional(),
  demoUrl: hackathonUrlSchema.nullish(),
  presentationUrl: hackathonUrlSchema.nullish(),
  videoUrl: hackathonUrlSchema.nullish(),
  screenshotKeys: screenshotsSchema.optional(),
});
export type THackathonSubmissionUpdateInput = z.infer<
  typeof hackathonSubmissionUpdateInputSchema
>;

export const hackathonSubmissionAdminItemSchema =
  hackathonSubmissionSchema.extend({ team: hackathonTeamRefSchema });
export type THackathonSubmissionAdminItem = z.infer<
  typeof hackathonSubmissionAdminItemSchema
>;

export const hackathonSubmissionAdminListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  status: hackathonSubmissionStatusSchema.optional(),
});
export type THackathonSubmissionAdminListInput = z.infer<
  typeof hackathonSubmissionAdminListInputSchema
>;

export const hackathonSubmissionAdminListSchema = paginated(
  hackathonSubmissionAdminItemSchema
);
export type THackathonSubmissionAdminList = z.infer<
  typeof hackathonSubmissionAdminListSchema
>;
