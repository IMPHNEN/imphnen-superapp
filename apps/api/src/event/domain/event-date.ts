import type { TEventDateInput } from '@app/schemas';
import { match } from 'ts-pattern';

export const EVENT_TIMEZONE_OFFSET = '+07:00';

export const EVENT_DAY_BOUNDARY = {
  START: 'start',
  END: 'end',
} as const;

export type TEventDayBoundary =
  (typeof EVENT_DAY_BOUNDARY)[keyof typeof EVENT_DAY_BOUNDARY];

const DAY_START_TIME = 'T00:00:00.000';
const DAY_END_TIME = 'T23:59:59.999';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const timeOf = (boundary: TEventDayBoundary): string =>
  match(boundary)
    .with(EVENT_DAY_BOUNDARY.START, (): string => DAY_START_TIME)
    .with(EVENT_DAY_BOUNDARY.END, (): string => DAY_END_TIME)
    .exhaustive();

export const eventDateResolve = (
  value: TEventDateInput,
  boundary: TEventDayBoundary
): Date =>
  DATE_ONLY.test(value)
    ? new Date(`${value}${timeOf(boundary)}${EVENT_TIMEZONE_OFFSET}`)
    : new Date(value);
