import { HACKATHON_DEADLINE } from '@app/schemas';

export const TEAM_FEATURES_DEADLINE = new Date(
  HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE
);

export const SUBMISSION_DEADLINE = new Date(
  HACKATHON_DEADLINE.SUBMISSION_CLOSE
);

export const isTeamFeaturesClosed = (): boolean =>
  Date.now() >= TEAM_FEATURES_DEADLINE.getTime();

export const isSubmissionClosed = (): boolean =>
  Date.now() >= SUBMISSION_DEADLINE.getTime();

const WIB_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jakarta',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatDeadline = (deadline: Date): string =>
  `${WIB_FORMAT.format(deadline)} WIB`;
