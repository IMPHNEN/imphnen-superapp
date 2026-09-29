import { ALL_PERMISSIONS } from '@app/permissions';
import { z } from 'zod';

export const permissionSchema = z.enum(ALL_PERMISSIONS);

export const permissionInfoSchema = z.object({
  key: permissionSchema,
  label: z.string(),
});
export type TPermissionInfo = z.infer<typeof permissionInfoSchema>;

export const permissionListSchema = z.object({
  items: z.array(permissionInfoSchema).readonly(),
});
export type TPermissionList = z.infer<typeof permissionListSchema>;
