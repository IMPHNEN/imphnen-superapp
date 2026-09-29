import { type TUser, userSchema } from '@app/schemas';
import type { TUserRow } from '#/user/domain/user.ts';

export const toUserDto = (row: TUserRow): TUser =>
  userSchema.parse({
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
