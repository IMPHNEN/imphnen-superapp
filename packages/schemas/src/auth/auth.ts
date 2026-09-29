import { VALIDATION_MESSAGE } from '@app/messages';
import { z } from 'zod';
import { permissionSchema } from '../permission/permission.ts';

export const userIdSchema = z.union([z.uuid(), z.string().length(32)]);

export const sessionUserSchema = z.object({
  id: userIdSchema,
  email: z.email(),
  name: z.string(),
  role: z.string().min(1),
  image: z.string().nullable(),
});
export type TSessionUser = z.infer<typeof sessionUserSchema>;

export const meSchema = z.object({
  user: sessionUserSchema,
  permissions: z.array(permissionSchema).readonly(),
});
export type TMe = z.infer<typeof meSchema>;

export const passwordChangeInputSchema = z.object({
  currentPassword: z
    .string()
    .min(1, VALIDATION_MESSAGE.CURRENT_PASSWORD_REQUIRED),
  newPassword: z
    .string()
    .min(8, VALIDATION_MESSAGE.PASSWORD_TOO_SHORT)
    .max(128, VALIDATION_MESSAGE.PASSWORD_TOO_LONG),
});
export type TPasswordChangeInput = z.infer<typeof passwordChangeInputSchema>;

export const loginInputSchema = z.object({
  email: z.email(VALIDATION_MESSAGE.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGE.PASSWORD_REQUIRED),
});
export type TLoginInput = z.infer<typeof loginInputSchema>;

export const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});
export type TLoginSearch = z.infer<typeof loginSearchSchema>;
