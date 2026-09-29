import {
  profileAvatarUploadInputSchema,
  profileSchema,
  profileUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const profileContract = {
  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PROFILE })
    .output(profileSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.PROFILE })
    .input(profileUpdateInputSchema)
    .output(profileSchema),

  avatarUpload: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.PROFILE_AVATAR })
    .input(profileAvatarUploadInputSchema)
    .output(profileSchema),
};
