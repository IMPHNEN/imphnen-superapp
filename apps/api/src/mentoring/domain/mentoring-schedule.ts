export const MINUTE_MS = 60_000;

export const DAY_MS = 86_400_000;

export const AVAILABILITY_WINDOW_DAYS = 14;

export const sessionEndOf = (start: Date, durationMinutes: number): Date =>
  new Date(start.getTime() + durationMinutes * MINUTE_MS);
