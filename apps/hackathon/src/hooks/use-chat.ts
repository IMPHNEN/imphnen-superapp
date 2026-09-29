import type { THackathonMessage } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const POLL_INTERVAL_MS = 3000;

const byTimeThenId = (a: THackathonMessage, b: THackathonMessage): number =>
  a.createdAt === b.createdAt
    ? a.id.localeCompare(b.id)
    : a.createdAt.localeCompare(b.createdAt);

const mergeMessages = (
  current: ReadonlyMap<string, THackathonMessage>,
  incoming: readonly THackathonMessage[]
): Map<string, THackathonMessage> => {
  const next = new Map(current);
  for (const message of incoming) next.set(message.id, message);
  return next;
};

/**
 * Team chat: loads the latest page, polls for newer messages with
 * `after = last id`, and loads older pages on demand with `before`.
 */
export const useTeamChat = (teamId: string, enabled: boolean) => {
  const queryClient = useQueryClient();
  const [store, setStore] = useState<{
    teamId: string;
    messages: Map<string, THackathonMessage>;
  }>({ teamId, messages: new Map() });
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const messagesMap = store.teamId === teamId ? store.messages : undefined;

  const merge = useCallback(
    (incoming: readonly THackathonMessage[]): void =>
      setStore((prev) => ({
        teamId,
        messages: mergeMessages(
          prev.teamId === teamId ? prev.messages : new Map(),
          incoming
        ),
      })),
    [teamId]
  );

  const messages = useMemo(
    () => (messagesMap ? [...messagesMap.values()].sort(byTimeThenId) : []),
    [messagesMap]
  );
  const lastId = messages.at(-1)?.id;
  const firstId = messages.at(0)?.id;

  const latest = useQuery(
    orpc.hackathon.message.list.queryOptions({
      input: { teamId },
      enabled: enabled && !!teamId,
      refetchInterval: lastId ? false : POLL_INTERVAL_MS,
    })
  );

  useEffect(() => {
    if (!latest.data) return;
    merge(latest.data.items);
    if (!firstId) setHasOlder(latest.data.hasMore);
  }, [latest.data, merge, firstId]);

  const newer = useQuery(
    orpc.hackathon.message.list.queryOptions({
      input: { teamId, after: lastId },
      enabled: enabled && !!teamId && !!lastId,
      refetchInterval: POLL_INTERVAL_MS,
    })
  );

  useEffect(() => {
    if (newer.data && newer.data.items.length > 0) merge(newer.data.items);
  }, [newer.data, merge]);

  const loadOlder = async (): Promise<void> => {
    if (!firstId || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const page = await queryClient.fetchQuery(
        orpc.hackathon.message.list.queryOptions({
          input: { teamId, before: firstId },
        })
      );
      merge(page.items);
      setHasOlder(page.hasMore);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const send = useMutation(
    orpc.hackathon.message.send.mutationOptions({
      onSuccess: (message): void => merge([message]),
    })
  );

  const remove = useMutation(
    orpc.hackathon.message.remove.mutationOptions({
      onSuccess: ({ id }): void => {
        setStore((prev) => {
          const next = new Map(prev.messages);
          next.delete(id);
          return { teamId: prev.teamId, messages: next };
        });
        void queryClient.invalidateQueries({
          queryKey: orpc.hackathon.message.key(),
        });
      },
    })
  );

  return {
    messages,
    isLoading: latest.isPending && enabled,
    error: latest.error,
    hasOlder,
    isLoadingOlder,
    loadOlder,
    send,
    remove,
  };
};
