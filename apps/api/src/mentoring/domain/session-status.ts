import {
  MENTORING_SESSION_STATUS,
  type TMentoringSessionStatus,
} from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import {
  SESSION_ROLE,
  type TSessionRole,
} from '#/mentoring/domain/session-actor.ts';

type TTransitionTable = Readonly<
  Record<
    TMentoringSessionStatus,
    Partial<Record<TMentoringSessionStatus, readonly TSessionRole[]>>
  >
>;

const EVERY_PARTICIPANT: readonly TSessionRole[] = [
  SESSION_ROLE.MENTEE,
  SESSION_ROLE.MENTOR,
  SESSION_ROLE.MANAGER,
];

const MENTOR_SIDE: readonly TSessionRole[] = [
  SESSION_ROLE.MENTOR,
  SESSION_ROLE.MANAGER,
];

export const SESSION_TRANSITIONS: TTransitionTable = {
  [MENTORING_SESSION_STATUS.PENDING]: {
    [MENTORING_SESSION_STATUS.CONFIRMED]: MENTOR_SIDE,
    [MENTORING_SESSION_STATUS.CANCELLED]: EVERY_PARTICIPANT,
  },
  [MENTORING_SESSION_STATUS.CONFIRMED]: {
    [MENTORING_SESSION_STATUS.COMPLETED]: MENTOR_SIDE,
    [MENTORING_SESSION_STATUS.NO_SHOW]: MENTOR_SIDE,
    [MENTORING_SESSION_STATUS.CANCELLED]: EVERY_PARTICIPANT,
  },
  [MENTORING_SESSION_STATUS.COMPLETED]: {},
  [MENTORING_SESSION_STATUS.CANCELLED]: {},
  [MENTORING_SESSION_STATUS.NO_SHOW]: {},
};

export const SESSION_REQUIRES_START: readonly TMentoringSessionStatus[] = [
  MENTORING_SESSION_STATUS.COMPLETED,
  MENTORING_SESSION_STATUS.NO_SHOW,
];

export const SESSION_OPEN: readonly TMentoringSessionStatus[] = [
  MENTORING_SESSION_STATUS.PENDING,
  MENTORING_SESSION_STATUS.CONFIRMED,
];

export const MEETING_LINK_EDITORS: readonly TSessionRole[] = MENTOR_SIDE;

export const sessionTransitionRoles = (
  from: TMentoringSessionStatus,
  to: TMentoringSessionStatus
): readonly TSessionRole[] | undefined =>
  D.get(SESSION_TRANSITIONS[from], to) ?? undefined;

export const sessionRolesPermit = (
  held: readonly TSessionRole[],
  permitted: readonly TSessionRole[]
): boolean => A.some(held, (role) => A.includes(permitted, role));

export const sessionIsOpen = (status: TMentoringSessionStatus): boolean =>
  A.includes(SESSION_OPEN, status);

export const sessionRequiresStart = (
  status: TMentoringSessionStatus
): boolean => A.includes(SESSION_REQUIRES_START, status);
