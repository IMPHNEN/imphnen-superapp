import {
  roadmapCreateInputSchema,
  roadmapIdInputSchema,
  roadmapItemSchema,
  roadmapListInputSchema,
  roadmapListSchema,
  roadmapUpdateInputSchema,
  roadmapVoteInputSchema,
  roadmapVoteSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const roadmapContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROADMAP_ITEMS })
    .input(roadmapListInputSchema)
    .output(roadmapListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROADMAP_ITEM })
    .input(roadmapIdInputSchema)
    .output(roadmapItemSchema),

  vote: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.ROADMAP_ITEM_VOTE })
    .input(roadmapVoteInputSchema)
    .output(roadmapVoteSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.ROADMAP_ITEMS })
    .input(roadmapCreateInputSchema)
    .output(roadmapItemSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.ROADMAP_ITEM })
    .input(roadmapUpdateInputSchema)
    .output(roadmapItemSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.ROADMAP_ITEM })
    .input(roadmapIdInputSchema)
    .output(roadmapIdInputSchema),
};
