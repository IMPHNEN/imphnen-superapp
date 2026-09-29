import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';

export type TMentoringSession = TClientOutputs['mentoring']['get'];
export type TMentoringSessionStatus = TMentoringSession['status'];
type TListMineInput = TClientInputs['mentoring']['listMine'];

export const SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const satisfies Record<string, TMentoringSessionStatus>;

export const SESSION_STATUS_LABEL: Record<TMentoringSessionStatus, string> = {
  pending: 'Menunggu',
  confirmed: 'To do',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const SESSION_STATUS_BADGE: Record<
  TMentoringSessionStatus,
  'warning' | 'info' | 'success' | 'destructive' | 'secondary'
> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'destructive',
};

/** Sessions of the signed-in user, as mentee (default) or as mentor. */
export const useMySessions = (input: TListMineInput) =>
  useQuery({
    ...orpc.mentoring.listMine.queryOptions({ input }),
    placeholderData: keepPreviousData,
  });

export const useMentorStats = () =>
  useQuery(orpc.mentoring.mentorStats.queryOptions());

const useInvalidateMentoring = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: orpc.mentoring.key() });
};

export const useCancelSession = () => {
  const invalidate = useInvalidateMentoring();
  return useMutation(
    orpc.mentoring.cancel.mutationOptions({ onSuccess: invalidate })
  );
};

/** Mentor side of the state machine: confirm, complete, no-show, link. */
export const useUpdateSession = () => {
  const invalidate = useInvalidateMentoring();
  return useMutation(
    orpc.mentoring.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useSubmitFeedback = () => {
  const invalidate = useInvalidateMentoring();
  return useMutation(
    orpc.mentoring.feedbackSubmit.mutationOptions({ onSuccess: invalidate })
  );
};

const DATE_FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const TIME_FORMAT = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });

const MINUTE_MS = 60_000;

export type TSessionTime = {
  date: string;
  weekday: string;
  start: string;
  end: string;
};

export const sessionTime = (session: TMentoringSession): TSessionTime => {
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + session.durationMinutes * MINUTE_MS);
  return {
    date: DATE_FORMAT.format(start),
    weekday: WEEKDAY_FORMAT.format(start),
    start: TIME_FORMAT.format(start),
    end: TIME_FORMAT.format(end),
  };
};

export const formatDate = (iso: string): string =>
  DATE_FORMAT.format(new Date(iso));

export const hasStarted = (session: TMentoringSession): boolean =>
  new Date(session.scheduledAt).getTime() <= Date.now();

export const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** The signed-in mentor's own profile (`null` without an application). */
export const useMyMentorProfile = () => useQuery(orpc.mentor.me.queryOptions());

export const useUpdateMyMentorProfile = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.mentor.meUpdate.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: orpc.mentor.key() }),
    })
  );
};
