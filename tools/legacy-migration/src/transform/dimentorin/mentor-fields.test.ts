import { describe, expect, it } from 'vitest';
import {
  menteeLevelText,
  mentorStatusOf,
  metadataTextOf,
} from './mentor-fields.ts';
import { sessionStatusOf, sessionTypeOf } from './session-transform.ts';

describe('mentor field mapping', () => {
  it('maps every legacy mentor status', (): void => {
    expect(mentorStatusOf('verified')).toEqual({
      status: 'active',
      known: true,
    });
    expect(mentorStatusOf(null)).toEqual({ status: 'pending', known: true });
    expect(mentorStatusOf(' ')).toEqual({ status: 'pending', known: true });
    expect(mentorStatusOf('rejected')).toEqual({
      status: 'rejected',
      known: true,
    });
    expect(mentorStatusOf('banned')).toEqual({
      status: 'inactive',
      known: false,
    });
  });

  it('reads preferred_mentee_level as JSON text, keeping plain seeder strings', (): void => {
    expect(menteeLevelText('["beginner","junior"]')).toBe(
      '["beginner","junior"]'
    );
    expect(menteeLevelText(' Beginner ')).toBe('["Beginner"]');
    expect(menteeLevelText('"senior"')).toBe('["senior"]');
    expect(menteeLevelText('')).toBe('[]');
    expect(menteeLevelText(null)).toBe('[]');
    expect(menteeLevelText('{"a":1}')).toBe('[]');
  });

  it('reads metadata values like Postgres ->> does', (): void => {
    expect(metadataTextOf('Bandung')).toBe('Bandung');
    expect(metadataTextOf('')).toBeNull();
    expect(metadataTextOf(12)).toBe('12');
    expect(metadataTextOf(null)).toBeNull();
    expect(metadataTextOf({ a: 1 })).toBe('{"a":1}');
  });

  it('maps session statuses and types', (): void => {
    expect(sessionStatusOf('no_show')).toEqual({
      status: 'no_show',
      known: true,
    });
    expect(sessionStatusOf('canceled')).toEqual({
      status: 'cancelled',
      known: true,
    });
    expect(sessionStatusOf('lost')).toEqual({
      status: 'cancelled',
      known: false,
    });
    expect(sessionTypeOf('offline')).toBe('offline');
    expect(sessionTypeOf('phone_call')).toBe('online');
  });
});
