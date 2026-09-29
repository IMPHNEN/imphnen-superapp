import type {
  THackathonParticipantUpdateInput,
  TProfileUpdateInput,
} from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import { SESSION_QUERY_KEY } from '@imphnen-frontend-service/service/session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useParticipantMe = (enabled = true) =>
  useQuery({
    ...orpc.hackathon.participant.me.queryOptions(),
    enabled,
  });

export const useParticipant = (userId: string) =>
  useQuery(
    orpc.hackathon.participant.get.queryOptions({
      input: { userId },
      enabled: !!userId,
    })
  );

export type TProfileSaveInput = {
  name?: string;
  avatar?: File | null;
  participant: THackathonParticipantUpdateInput;
};

/**
 * Saves the hackathon profile: the display name and avatar live on the
 * platform user (profile.*), the hackathon fields on the participant.
 */
export const useProfileSave = () => {
  const queryClient = useQueryClient();
  const profileUpdate = useMutation(orpc.profile.update.mutationOptions());
  const avatarUpload = useMutation(orpc.profile.avatarUpload.mutationOptions());
  const participantUpdate = useMutation(
    orpc.hackathon.participant.updateMe.mutationOptions()
  );

  const mutation = useMutation({
    mutationFn: async (input: TProfileSaveInput): Promise<void> => {
      if (input.avatar) {
        await avatarUpload.mutateAsync({ file: input.avatar });
      }
      if (input.name !== undefined) {
        const profileInput: TProfileUpdateInput = { name: input.name };
        await profileUpdate.mutateAsync(profileInput);
      }
      await participantUpdate.mutateAsync(input.participant);
    },
    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: orpc.profile.key() }),
        queryClient.invalidateQueries({
          queryKey: orpc.hackathon.participant.key(),
        }),
        queryClient.invalidateQueries({ queryKey: orpc.hackathon.team.key() }),
      ]);
    },
  });

  return mutation;
};
