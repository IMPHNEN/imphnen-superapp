import { userActiveSet } from '#/user/application/user-active-set.ts';
import { userCreate } from '#/user/application/user-create.ts';
import { userDelete } from '#/user/application/user-delete.ts';
import { userGet } from '#/user/application/user-get.ts';
import { userList } from '#/user/application/user-list.ts';
import { userPasswordReset } from '#/user/application/user-password-reset.ts';
import { userUpdate } from '#/user/application/user-update.ts';

export const userApplication = {
  list: userList,
  get: userGet,
  create: userCreate,
  update: userUpdate,
  setActive: userActiveSet,
  remove: userDelete,
  resetPassword: userPasswordReset,
};
