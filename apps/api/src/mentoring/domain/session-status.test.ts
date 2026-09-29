import { MENTORING_SESSION_STATUS } from '@app/schemas';
import { describe, expect, it } from 'vitest';
import { SESSION_ROLE } from '#/mentoring/domain/session-actor.ts';
import {
  sessionRolesPermit,
  sessionTransitionRoles,
} from '#/mentoring/domain/session-status.ts';

const { PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW } =
  MENTORING_SESSION_STATUS;

describe('session state machine', () => {
  it.each([
    [PENDING, CONFIRMED],
    [PENDING, CANCELLED],
    [CONFIRMED, COMPLETED],
    [CONFIRMED, NO_SHOW],
    [CONFIRMED, CANCELLED],
  ] as const)('allows %s -> %s', (from, to): void => {
    expect(sessionTransitionRoles(from, to)).toBeDefined();
  });

  it.each([
    [PENDING, COMPLETED],
    [PENDING, NO_SHOW],
    [CONFIRMED, PENDING],
    [COMPLETED, CANCELLED],
    [CANCELLED, CONFIRMED],
    [NO_SHOW, COMPLETED],
  ] as const)('forbids %s -> %s', (from, to): void => {
    expect(sessionTransitionRoles(from, to)).toBeUndefined();
  });

  it('keeps confirming and closing on the mentor side', (): void => {
    const confirm = sessionTransitionRoles(PENDING, CONFIRMED) ?? [];
    const cancel = sessionTransitionRoles(PENDING, CANCELLED) ?? [];

    expect(sessionRolesPermit([SESSION_ROLE.MENTEE], confirm)).toBe(false);
    expect(sessionRolesPermit([SESSION_ROLE.MENTOR], confirm)).toBe(true);
    expect(sessionRolesPermit([SESSION_ROLE.MANAGER], confirm)).toBe(true);
    expect(sessionRolesPermit([SESSION_ROLE.MENTEE], cancel)).toBe(true);
  });
});
