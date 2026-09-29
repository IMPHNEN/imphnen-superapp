import type {
  THackathonTeam,
  THackathonTeamBrowseInput,
  THackathonUploadKind,
} from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const useInvalidateTeams = () => {
  const queryClient = useQueryClient();
  return (): Promise<void> =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.hackathon.team.key() }),
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.participant.key(),
      }),
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.certificate.key(),
      }),
    ]).then(() => undefined);
};

export const useTeamBrowse = (input: Partial<THackathonTeamBrowseInput>) =>
  useQuery({
    ...orpc.hackathon.team.browse.queryOptions({ input }),
    placeholderData: keepPreviousData,
  });

export const useTeam = (id: string) =>
  useQuery(
    orpc.hackathon.team.get.queryOptions({ input: { id }, enabled: !!id })
  );

export const useMyTeam = () => {
  const { isAuthenticated } = useCurrentUser();
  return useQuery({
    ...orpc.hackathon.team.mine.queryOptions(),
    enabled: isAuthenticated,
  });
};

export const useTeamCreate = () => {
  const invalidate = useInvalidateTeams();
  return useMutation(
    orpc.hackathon.team.create.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTeamUpdate = () => {
  const invalidate = useInvalidateTeams();
  return useMutation(
    orpc.hackathon.team.update.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTeamRemove = () => {
  const invalidate = useInvalidateTeams();
  return useMutation(
    orpc.hackathon.team.remove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useTeamLeave = () => {
  const invalidate = useInvalidateTeams();
  return useMutation(
    orpc.hackathon.team.leave.mutationOptions({ onSuccess: invalidate })
  );
};

export const useMemberRemove = () => {
  const invalidate = useInvalidateTeams();
  return useMutation(
    orpc.hackathon.team.memberRemove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useHackathonUpload = () =>
  useMutation(orpc.hackathon.upload.create.mutationOptions());

export type TUploadRequest = { kind: THackathonUploadKind; file: File };

/** Membership facts about the signed-in user for one team. */
export const useTeamRole = (team: THackathonTeam | undefined) => {
  const { me } = useCurrentUser();
  const userId = me?.user.id;
  const member = team?.members.find((m) => m.user.id === userId);
  return {
    userId,
    isMember: !!member,
    isLeader: !!team && team.leader.id === userId,
    member,
  };
};
