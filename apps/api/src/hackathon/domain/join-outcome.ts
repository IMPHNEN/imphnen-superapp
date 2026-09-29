export const JOIN_OUTCOME = {
  JOINED: 'joined',
  TEAM_GONE: 'team_gone',
  TEAM_FULL: 'team_full',
  TEAM_LOCKED: 'team_locked',
  NOT_PENDING: 'not_pending',
} as const;

export type TJoinOutcome = (typeof JOIN_OUTCOME)[keyof typeof JOIN_OUTCOME];
