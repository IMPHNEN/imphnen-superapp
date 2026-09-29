import { A } from '@mobily/ts-belt';
import type { TMentoringSessionRow } from '#/mentoring/domain/mentoring-session.ts';

export const SESSION_ROLE = {
  MENTEE: 'mentee',
  MENTOR: 'mentor',
  MANAGER: 'manager',
} as const;

export type TSessionRole = (typeof SESSION_ROLE)[keyof typeof SESSION_ROLE];

export type TSessionActor = {
  userId: string;
  canManage: boolean;
};

export const sessionRolesOf = (
  row: TMentoringSessionRow,
  actor: TSessionActor
): readonly TSessionRole[] =>
  A.filterMap(
    [
      [row.mentee.userId === actor.userId, SESSION_ROLE.MENTEE],
      [row.mentor.userId === actor.userId, SESSION_ROLE.MENTOR],
      [actor.canManage, SESSION_ROLE.MANAGER],
    ] as const,
    ([held, role]): TSessionRole | undefined => (held ? role : undefined)
  );
