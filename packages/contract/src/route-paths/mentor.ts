const MENTORS = '/mentors';
const MENTOR_REVIEW = `${MENTORS}/review`;

export const MENTOR_ROUTE_PATH = {
  MENTORS,
  MENTOR: `${MENTORS}/{id}`,
  MENTOR_BY_USER: `${MENTORS}/by-user/{userId}`,
  MENTOR_ME: `${MENTORS}/me`,
  MENTOR_ME_DOCUMENTS: `${MENTORS}/me/documents`,
  MENTOR_REVIEW,
  MENTOR_REVIEW_ITEM: `${MENTOR_REVIEW}/{id}`,
  MENTOR_REVIEW_DECISION: `${MENTOR_REVIEW}/{id}/decision`,
  MENTOR_REVIEW_DOCUMENT: `${MENTOR_REVIEW}/{id}/documents/{kind}`,
} as const;
