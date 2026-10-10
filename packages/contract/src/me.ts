import { meSchema } from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const meContract = {
  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ME })
    .output(meSchema.nullable()),
};
