import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import {
  profileExtensionPatchSchema,
  profileExtensionSchema,
} from './profile-extension.ts';

export const profileSchema = baseSchema(userIdSchema).extend({
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().min(1),
  extension: profileExtensionSchema,
});
export type TProfile = TEntityOf<z.infer<typeof profileSchema>>;

export const profileUpdateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  extension: profileExtensionPatchSchema.optional(),
});
export type TProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>;

export const profileAvatarUploadInputSchema = z.object({
  file: z.file(),
});
export type TProfileAvatarUploadInput = z.infer<
  typeof profileAvatarUploadInputSchema
>;
