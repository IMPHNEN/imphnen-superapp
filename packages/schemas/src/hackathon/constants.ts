export const HACKATHON_LIMIT = {
  TEAM_MAX_MEMBERS: 5,
  SUBMIT_MIN_MEMBERS: 2,
  NAME_MAX: 100,
  TEXT_MAX: 2000,
  SHORT_TEXT_MAX: 500,
  PHONE_MAX: 30,
  SKILLS_MAX: 30,
  SKILL_MAX: 50,
  SCREENSHOTS_MAX: 10,
  URL_MAX: 2048,
  PRIZE_MAX: 200,
  MESSAGE_PAGE_DEFAULT: 50,
  MESSAGE_PAGE_MAX: 100,
  UPLOAD_MAX_BYTES: 5_242_880,
} as const;

export const HACKATHON_DEADLINE = {
  TEAM_FEATURES_CLOSE: '2025-11-30T16:59:00Z',
  SUBMISSION_CLOSE: '2025-12-07T16:59:00Z',
} as const;

export type THackathonDeadline =
  (typeof HACKATHON_DEADLINE)[keyof typeof HACKATHON_DEADLINE];

export const HACKATHON_TEAM_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type THackathonTeamVisibility =
  (typeof HACKATHON_TEAM_VISIBILITY)[keyof typeof HACKATHON_TEAM_VISIBILITY];

export const HACKATHON_MEMBER_ROLE = {
  LEADER: 'leader',
  MEMBER: 'member',
} as const;

export type THackathonMemberRole =
  (typeof HACKATHON_MEMBER_ROLE)[keyof typeof HACKATHON_MEMBER_ROLE];

export const HACKATHON_DECISION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type THackathonDecisionStatus =
  (typeof HACKATHON_DECISION_STATUS)[keyof typeof HACKATHON_DECISION_STATUS];

export const HACKATHON_SUBMISSION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
} as const;

export type THackathonSubmissionStatus =
  (typeof HACKATHON_SUBMISSION_STATUS)[keyof typeof HACKATHON_SUBMISSION_STATUS];

export const HACKATHON_UPLOAD_KIND = {
  TEAM_LOGO: 'team_logo',
  TEAM_BANNER: 'team_banner',
  SUBMISSION_SCREENSHOT: 'submission_screenshot',
} as const;

export type THackathonUploadKind =
  (typeof HACKATHON_UPLOAD_KIND)[keyof typeof HACKATHON_UPLOAD_KIND];

export const HACKATHON_IMAGE_TYPE = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  GIF: 'image/gif',
} as const;

export type THackathonImageType =
  (typeof HACKATHON_IMAGE_TYPE)[keyof typeof HACKATHON_IMAGE_TYPE];

export const HACKATHON_IMAGE_EXTENSION = {
  [HACKATHON_IMAGE_TYPE.JPEG]: 'jpg',
  [HACKATHON_IMAGE_TYPE.PNG]: 'png',
  [HACKATHON_IMAGE_TYPE.WEBP]: 'webp',
  [HACKATHON_IMAGE_TYPE.GIF]: 'gif',
} as const satisfies Record<THackathonImageType, string>;

export const HACKATHON_STORAGE_PREFIX = {
  TEAM: 'hackathon/team/',
  SUBMISSION: 'hackathon/submission/',
} as const;
