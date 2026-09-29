import { permissionListSchema } from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const permissionContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PERMISSIONS })
    .output(permissionListSchema),
};
