import { describe, expect, it } from 'vitest';
import {
  EVENT_DAY_BOUNDARY,
  eventDateResolve,
} from '#/event/domain/event-date.ts';

describe('eventDateResolve', () => {
  it('reads a date-only start as the start of that day in Jakarta', (): void => {
    expect(
      eventDateResolve('2025-09-20', EVENT_DAY_BOUNDARY.START).toISOString()
    ).toBe('2025-09-19T17:00:00.000Z');
  });

  it('reads a date-only end as the last millisecond of that day in Jakarta', (): void => {
    expect(
      eventDateResolve('2025-09-20', EVENT_DAY_BOUNDARY.END).toISOString()
    ).toBe('2025-09-20T16:59:59.999Z');
  });

  it('keeps the instant of a full ISO datetime', (): void => {
    expect(
      eventDateResolve(
        '2025-09-20T13:00:00+07:00',
        EVENT_DAY_BOUNDARY.START
      ).toISOString()
    ).toBe('2025-09-20T06:00:00.000Z');
  });
});
