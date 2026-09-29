import { VALIDATION_MESSAGE } from '@app/messages';
import { z } from 'zod';
import { permissionSchema } from '../permission/permission.ts';

export const RESERVED_ROLE_KEY = {
  CREATE: 'create',
} as const;

const roleKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]{1,49}$/, VALIDATION_MESSAGE.ROLE_KEY_FORMAT)
  .refine(
    (key): boolean => key !== RESERVED_ROLE_KEY.CREATE,
    VALIDATION_MESSAGE.ROLE_KEY_RESERVED
  );

export const roleSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable(),
  permissions: z.array(permissionSchema),
  fixed: z.boolean(),
  memberCount: z.number().int().min(0),
});
export type TRoleDto = z.infer<typeof roleSchema>;

export const roleCreateInputSchema = z.object({
  key: roleKeySchema,
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(permissionSchema).default([]),
});
export type TRoleCreateInput = z.infer<typeof roleCreateInputSchema>;

export const roleUpdateInputSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  permissions: z.array(permissionSchema).optional(),
});
export type TRoleUpdateInput = z.infer<typeof roleUpdateInputSchema>;

export const roleKeyInputSchema = z.object({ key: z.string().min(1) });
export type TRoleKeyInput = z.infer<typeof roleKeyInputSchema>;

export const roleListSchema = z.object({
  items: z.array(roleSchema).readonly(),
});
export type TRoleList = z.infer<typeof roleListSchema>;
