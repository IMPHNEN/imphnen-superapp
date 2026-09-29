import {
  mentorDocumentDownloadInputSchema,
  mentorDocumentSchema,
  mentorDocumentUploadInputSchema,
  mentorIdInputSchema,
  mentorListInputSchema,
  mentorMeSchema,
  mentorPrivateListSchema,
  mentorPrivateSchema,
  mentorProfilePatchSchema,
  mentorPublicListSchema,
  mentorPublicSchema,
  mentorRegisterInputSchema,
  mentorRemovedSchema,
  mentorReviewInputSchema,
  mentorReviewListInputSchema,
  mentorUpdateInputSchema,
  mentorUserIdInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const mentorContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTORS })
    .input(mentorListInputSchema)
    .output(mentorPublicListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTOR })
    .input(mentorIdInputSchema)
    .output(mentorPublicSchema),

  getByUser: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTOR_BY_USER })
    .input(mentorUserIdInputSchema)
    .output(mentorPublicSchema),

  me: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTOR_ME })
    .output(mentorMeSchema),

  register: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.MENTOR_ME })
    .input(mentorRegisterInputSchema)
    .output(mentorPrivateSchema),

  meUpdate: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.MENTOR_ME })
    .input(mentorProfilePatchSchema)
    .output(mentorPrivateSchema),

  documentUpload: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.MENTOR_ME_DOCUMENTS })
    .input(mentorDocumentUploadInputSchema)
    .output(mentorPrivateSchema),

  reviewList: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTOR_REVIEW })
    .input(mentorReviewListInputSchema)
    .output(mentorPrivateListSchema),

  reviewGet: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTOR_REVIEW_ITEM })
    .input(mentorIdInputSchema)
    .output(mentorPrivateSchema),

  documentDownload: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.MENTOR_REVIEW_DOCUMENT,
    })
    .input(mentorDocumentDownloadInputSchema)
    .output(mentorDocumentSchema),

  verify: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.MENTOR_REVIEW_DECISION,
    })
    .input(mentorReviewInputSchema)
    .output(mentorPrivateSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.MENTOR })
    .input(mentorUpdateInputSchema)
    .output(mentorPrivateSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.MENTOR })
    .input(mentorIdInputSchema)
    .output(mentorRemovedSchema),
};
