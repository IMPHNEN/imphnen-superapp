import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useInvalidateRequests = () => {
  const queryClient = useQueryClient();
  return (): Promise<void> =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.invitation.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.joinRequest.key(),
      }),
      queryClient.invalidateQueries({ queryKey: orpc.hackathon.team.key() }),
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.participant.key(),
      }),
    ]).then(() => undefined);
};

export const useMyInvitations = () =>
  useQuery(orpc.hackathon.invitation.mine.queryOptions());

export const useInvitationCreate = () => {
  const invalidate = useInvalidateRequests();
  return useMutation(
    orpc.hackathon.invitation.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useInvitationRespond = () => {
  const invalidate = useInvalidateRequests();
  return useMutation(
    orpc.hackathon.invitation.respond.mutationOptions({ onSuccess: invalidate })
  );
};

export const useMyJoinRequests = () =>
  useQuery(orpc.hackathon.joinRequest.mine.queryOptions());

export const useTeamJoinRequests = (teamId: string, enabled: boolean) =>
  useQuery(
    orpc.hackathon.joinRequest.teamPending.queryOptions({
      input: { teamId },
      enabled: enabled && !!teamId,
    })
  );

export const useJoinRequestCreate = () => {
  const invalidate = useInvalidateRequests();
  return useMutation(
    orpc.hackathon.joinRequest.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useJoinRequestRespond = () => {
  const invalidate = useInvalidateRequests();
  return useMutation(
    orpc.hackathon.joinRequest.respond.mutationOptions({
      onSuccess: invalidate,
    })
  );
};
