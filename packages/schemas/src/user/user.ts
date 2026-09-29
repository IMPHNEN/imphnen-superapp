import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

export const userSchema = baseSchema(userIdSchema).extend({
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().min(1),
  isActive: z.boolean(),
});
export type TUser = TEntityOf<z.infer<typeof userSchema>>;

export const userCreateInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
  role: z.string().min(1),
  isActive: z.boolean().default(true),
});
export type TUserCreateInput = z.infer<typeof userCreateInputSchema>;

export const userUpdateInputSchema = z.object({
  id: userIdSchema,
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).optional(),
});
export type TUserUpdateInput = z.infer<typeof userUpdateInputSchema>;

export const userActiveInputSchema = z.object({
  id: userIdSchema,
  isActive: z.boolean(),
});
export type TUserActiveInput = z.infer<typeof userActiveInputSchema>;

export const userIdInputSchema = z.object({ id: userIdSchema });
export type TUserIdInput = z.infer<typeof userIdInputSchema>;

export const userPasswordResetInputSchema = z.object({
  id: userIdSchema,
  password: z.string().min(8).max(128),
});
export type TUserPasswordResetInput = z.infer<
  typeof userPasswordResetInputSchema
>;

export const USER_SORT = {
  NAME: 'name',
  EMAIL: 'email',
  ROLE: 'role',
  CREATED_AT: 'createdAt',
} as const;

export type TUserSort = (typeof USER_SORT)[keyof typeof USER_SORT];

export const userListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z
    .enum([
      USER_SORT.NAME,
      USER_SORT.EMAIL,
      USER_SORT.ROLE,
      USER_SORT.CREATED_AT,
    ])
    .default(USER_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.ASC),
});
export type TUserListInput = z.infer<typeof userListInputSchema>;

export const userListSchema = paginated(userSchema);
export type TUserList = z.infer<typeof userListSchema>;
