import type { TMentoringSessionStatus } from '../../_hooks/use-mentoring';

export const SESSION_STATUS_TEXT: Record<TMentoringSessionStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const SESSION_STATUS_VARIANT: Record<
  TMentoringSessionStatus,
  'warning' | 'info' | 'success' | 'destructive' | 'secondary'
> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'destructive',
  no_show: 'secondary',
};

export const SESSION_STATUS_COLOR: Record<TMentoringSessionStatus, string> = {
  pending: 'bg-warning-200 text-warning-700',
  confirmed: 'bg-primary-200 text-primary-700',
  completed: 'bg-success-200 text-success-500',
  cancelled: 'bg-danger-200 text-danger-500',
  no_show: 'bg-neutral-200 text-neutral-700',
};

export const isSessionStatus = (
  value: string
): value is TMentoringSessionStatus =>
  Object.hasOwn(SESSION_STATUS_TEXT, value);
