import {
  hackathonCertificateSchema,
  hackathonIdInputSchema,
  hackathonMessageListInputSchema,
  hackathonMessageListSchema,
  hackathonMessageSchema,
  hackathonMessageSendInputSchema,
  hackathonSubmissionCreateInputSchema,
  hackathonSubmissionSchema,
  hackathonSubmissionUpdateInputSchema,
  hackathonTeamIdInputSchema,
  hackathonUploadInputSchema,
  hackathonUploadSchema,
  hackathonWinnerListSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from '../http-methods.ts';
import { ROUTE_PATH } from '../route-paths.ts';

export const hackathonMessageContract = {
  list: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_TEAM_MESSAGES,
    })
    .input(hackathonMessageListInputSchema)
    .output(hackathonMessageListSchema),

  send: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_TEAM_MESSAGES,
    })
    .input(hackathonMessageSendInputSchema)
    .output(hackathonMessageSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.HACKATHON_MESSAGE })
    .input(hackathonIdInputSchema)
    .output(hackathonIdInputSchema),
};

export const hackathonSubmissionContract = {
  getByTeam: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_TEAM_SUBMISSION,
    })
    .input(hackathonTeamIdInputSchema)
    .output(hackathonSubmissionSchema.nullable()),

  create: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_TEAM_SUBMISSION,
    })
    .input(hackathonSubmissionCreateInputSchema)
    .output(hackathonSubmissionSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.HACKATHON_SUBMISSION })
    .input(hackathonSubmissionUpdateInputSchema)
    .output(hackathonSubmissionSchema),

  submit: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_SUBMISSION_SUBMIT,
    })
    .input(hackathonIdInputSchema)
    .output(hackathonSubmissionSchema),

  confirm: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_SUBMISSION_CONFIRM,
    })
    .input(hackathonIdInputSchema)
    .output(hackathonSubmissionSchema),

  cancel: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_SUBMISSION_CANCEL,
    })
    .input(hackathonIdInputSchema)
    .output(hackathonSubmissionSchema),
};

export const hackathonUploadContract = {
  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.HACKATHON_UPLOADS })
    .input(hackathonUploadInputSchema)
    .output(hackathonUploadSchema),
};

export const hackathonWinnerContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_WINNERS })
    .output(hackathonWinnerListSchema),
};

export const hackathonCertificateContract = {
  mine: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_CERTIFICATES_MINE,
    })
    .output(hackathonCertificateSchema.nullable()),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_CERTIFICATE })
    .input(hackathonIdInputSchema)
    .output(hackathonCertificateSchema),
};
