import {
  MENTOR_REVIEW_DECISION,
  MENTOR_STATUS,
  type TMentorReviewDecision,
  type TMentorStatus,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';

export const MENTOR_REVIEW_FROM: Readonly<
  Record<TMentorReviewDecision, readonly TMentorStatus[]>
> = {
  [MENTOR_REVIEW_DECISION.APPROVE]: [
    MENTOR_STATUS.PENDING,
    MENTOR_STATUS.INACTIVE,
  ],
  [MENTOR_REVIEW_DECISION.REJECT]: [MENTOR_STATUS.PENDING],
};

export const MENTOR_REVIEW_TO: Readonly<
  Record<TMentorReviewDecision, TMentorStatus>
> = {
  [MENTOR_REVIEW_DECISION.APPROVE]: MENTOR_STATUS.ACTIVE,
  [MENTOR_REVIEW_DECISION.REJECT]: MENTOR_STATUS.REJECTED,
};

export const MENTOR_REAPPLY_FROM: readonly TMentorStatus[] = [
  MENTOR_STATUS.REJECTED,
];

export const mentorReviewAllowed = (
  status: TMentorStatus,
  decision: TMentorReviewDecision
): boolean => A.includes(MENTOR_REVIEW_FROM[decision], status);

export const mentorReapplyAllowed = (status: TMentorStatus): boolean =>
  A.includes(MENTOR_REAPPLY_FROM, status);

export const mentorIsPublic = (status: TMentorStatus): boolean =>
  status === MENTOR_STATUS.ACTIVE;
