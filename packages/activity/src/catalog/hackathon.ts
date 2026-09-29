export const HACKATHON_ACTIVITY_RESOURCE_TYPE = {
  HACKATHON_TEAM: 'hackathon.team',
  HACKATHON_SUBMISSION: 'hackathon.submission',
  HACKATHON_WINNER: 'hackathon.winner',
} as const;

export const HACKATHON_ACTIVITY_ACTION = {
  HACKATHON_TEAM_CREATE: 'hackathon.team.create',
  HACKATHON_TEAM_DELETE: 'hackathon.team.delete',
  HACKATHON_SUBMISSION_CONFIRM: 'hackathon.submission.confirm',
  HACKATHON_WINNER_SET: 'hackathon.winner.set',
  HACKATHON_WINNER_REMOVE: 'hackathon.winner.remove',
} as const;
