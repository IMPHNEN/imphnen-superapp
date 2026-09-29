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

export type TMentorPublic = TClientOutputs['mentor']['get'];
export type TMentoringBookInput = TClientInputs['mentoring']['book'];

type TMentorListParams = {
  page: number;
  pageSize: number;
  search?: string;
};

export const useMentorList = ({ page, pageSize, search }: TMentorListParams) =>
  useQuery({
    ...orpc.mentor.list.queryOptions({
      input: { page, pageSize, search: search?.trim() || undefined },
    }),
    placeholderData: keepPreviousData,
  });

export const useMentor = (id: string) =>
  useQuery({
    ...orpc.mentor.get.queryOptions({ input: { id } }),
    enabled: id.length > 0,
  });

export const useMentorAvailability = (mentorUserId: string | undefined) =>
  useQuery({
    ...orpc.mentoring.availability.queryOptions({
      input: { mentorUserId: mentorUserId ?? '' },
    }),
    enabled: Boolean(mentorUserId),
  });

export const useBookSession = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.mentoring.book.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: orpc.mentoring.key() }),
    })
  );
};

export type TMentoringAvailability =
  TClientOutputs['mentoring']['availability'];
