import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TTestimonialItem = TClientOutputs['testimonial']['get'];
export type TTestimonialStatus = TTestimonialItem['status'];

export const TESTIMONIAL_LOOKUP_PAGE_SIZE = 100;

export const useTestimonialModerationList = (
  input: TClientInputs['testimonial']['moderationList']
) =>
  useQuery(
    orpc.testimonial.moderationList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useTestimonialCreate = () => {
  const invalidate = useInvalidate(orpc.testimonial.key());
  return useMutation(
    orpc.testimonial.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTestimonialUpdate = () => {
  const invalidate = useInvalidate(orpc.testimonial.key());
  return useMutation(
    orpc.testimonial.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTestimonialModerate = () => {
  const invalidate = useInvalidate(orpc.testimonial.key());
  return useMutation(
    orpc.testimonial.moderate.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTestimonialRemove = () => {
  const invalidate = useInvalidate(orpc.testimonial.key());
  return useMutation(
    orpc.testimonial.remove.mutationOptions({ onSuccess: invalidate })
  );
};
