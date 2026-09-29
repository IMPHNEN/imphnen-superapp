import type { TTestimonial, TTestimonialCreateInput } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import {
  SESSION_STATUS,
  type TSessionStatus,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { loginUrlFor } from '@/lib/redirect';

const HOME_TESTIMONIAL_COUNT = 6;
const MINE_PAGE_SIZE = 20;
const SUBMIT_PATH = '/testimonials/submit';

/** Approved testimonials only: the public list never returns pending ones. */
export const useLatestTestimonials = (): readonly TTestimonial[] => {
  const { data } = useQuery(
    orpc.testimonial.list.queryOptions({
      input: { pageSize: HOME_TESTIMONIAL_COUNT },
    })
  );
  return data?.items ?? [];
};

/** Sends visitors without a session to the login page and back here. */
export const useSubmitGuard = (): TSessionStatus => {
  const { status } = useCurrentUser();
  useEffect(() => {
    if (status === SESSION_STATUS.UNAUTHENTICATED) {
      window.location.href = loginUrlFor(SUBMIT_PATH);
    }
  }, [status]);
  return status;
};

export const useMyTestimonials = (
  enabled: boolean
): readonly TTestimonial[] => {
  const { data } = useQuery({
    ...orpc.testimonial.mine.queryOptions({
      input: { pageSize: MINE_PAGE_SIZE },
    }),
    enabled,
  });
  return data?.items ?? [];
};

type TTestimonialSubmit = {
  submit: (input: TTestimonialCreateInput, onDone: () => void) => void;
  isPending: boolean;
  submitted: TTestimonial | undefined;
  errorMessage: string;
  reset: () => void;
};

export const useTestimonialSubmit = (): TTestimonialSubmit => {
  const queryClient = useQueryClient();
  const create = useMutation(
    orpc.testimonial.create.mutationOptions({
      onSuccess: (): Promise<void> =>
        queryClient.invalidateQueries({
          queryKey: orpc.testimonial.mine.key(),
        }),
    })
  );

  return {
    submit: (input, onDone): void =>
      create.mutate(input, { onSuccess: onDone }),
    isPending: create.isPending,
    submitted: create.data,
    errorMessage: create.error?.message ?? '',
    reset: create.reset,
  };
};
