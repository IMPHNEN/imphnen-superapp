import type { TRoadmapItem, TRoadmapVote } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import {
  SESSION_STATUS,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loginUrlFor } from '@/lib/redirect';

const ROADMAP_PAGE_SIZE = 100;
const ROADMAP_PATH = '/roadmap';

const roadmapListOptions = orpc.roadmap.list.queryOptions({
  input: { pageSize: ROADMAP_PAGE_SIZE },
});

type TRoadmap = {
  items: readonly TRoadmapItem[];
  isLoading: boolean;
  isError: boolean;
  pendingVoteId: string | null;
  voteError: string;
  toggleVote: (item: TRoadmapItem) => void;
};

const withVote = (
  items: readonly TRoadmapItem[],
  vote: TRoadmapVote
): TRoadmapItem[] =>
  items.map((item) =>
    item.id === vote.id
      ? { ...item, votes: vote.votes, votedByMe: vote.votedByMe }
      : item
  );

export const useRoadmap = (): TRoadmap => {
  const queryClient = useQueryClient();
  const { status, isAuthenticated } = useCurrentUser();
  // votedByMe depends on the session, so the list waits for it to resolve.
  const list = useQuery({
    ...roadmapListOptions,
    enabled: status !== SESSION_STATUS.LOADING,
  });

  const vote = useMutation(
    orpc.roadmap.vote.mutationOptions({
      onSuccess: (result): void => {
        queryClient.setQueryData(roadmapListOptions.queryKey, (previous) =>
          previous
            ? { ...previous, items: withVote(previous.items, result) }
            : previous
        );
      },
      onError: (): Promise<void> =>
        queryClient.invalidateQueries({ queryKey: orpc.roadmap.key() }),
    })
  );

  const toggleVote = (item: TRoadmapItem): void => {
    if (!isAuthenticated) {
      window.location.href = loginUrlFor(ROADMAP_PATH);
      return;
    }
    vote.mutate({ id: item.id, voted: !item.votedByMe });
  };

  return {
    items: list.data?.items ?? [],
    isLoading: list.isPending,
    isError: list.isError,
    pendingVoteId: vote.isPending ? (vote.variables?.id ?? null) : null,
    voteError: vote.error?.message ?? '',
    toggleVote,
  };
};
