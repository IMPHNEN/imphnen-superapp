import type {
  THackathonSubmission,
  THackathonSubmissionCreateInput,
} from '@app/schemas';
import { HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useTeamSubmission = (teamId: string, enabled = true) =>
  useQuery(
    orpc.hackathon.submission.getByTeam.queryOptions({
      input: { teamId },
      enabled: enabled && !!teamId,
    })
  );

const useInvalidateSubmission = () => {
  const queryClient = useQueryClient();
  return (): Promise<void> =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.submission.key(),
      }),
      queryClient.invalidateQueries({ queryKey: orpc.hackathon.team.key() }),
      queryClient.invalidateQueries({
        queryKey: orpc.hackathon.certificate.key(),
      }),
    ]).then(() => undefined);
};

export type TSubmissionSaveInput = Omit<
  THackathonSubmissionCreateInput,
  'screenshotKeys'
> & { screenshotKeys: string[] };

/**
 * Saves the draft (create or update) and then submits and confirms it,
 * which is the one-step flow the submit page offers.
 */
export const useSubmissionSubmit = () => {
  const invalidate = useInvalidateSubmission();
  const create = useMutation(
    orpc.hackathon.submission.create.mutationOptions()
  );
  const update = useMutation(
    orpc.hackathon.submission.update.mutationOptions()
  );
  const submit = useMutation(
    orpc.hackathon.submission.submit.mutationOptions()
  );
  const confirm = useMutation(
    orpc.hackathon.submission.confirm.mutationOptions()
  );

  return useMutation({
    mutationFn: async ({
      existing,
      input,
    }: {
      existing: THackathonSubmission | null | undefined;
      input: TSubmissionSaveInput;
    }): Promise<THackathonSubmission> => {
      let draft: THackathonSubmission;
      if (existing) {
        const { teamId: _teamId, ...fields } = input;
        draft =
          existing.status === HACKATHON_SUBMISSION_STATUS.DRAFT
            ? await update.mutateAsync({
                id: existing.id,
                ...fields,
                demoUrl: fields.demoUrl ?? null,
                presentationUrl: fields.presentationUrl ?? null,
                videoUrl: fields.videoUrl ?? null,
              })
            : existing;
      } else {
        draft = await create.mutateAsync(input);
      }
      if (draft.status === HACKATHON_SUBMISSION_STATUS.DRAFT) {
        draft = await submit.mutateAsync({ id: draft.id });
      }
      if (draft.status === HACKATHON_SUBMISSION_STATUS.PENDING) {
        draft = await confirm.mutateAsync({ id: draft.id });
      }
      return draft;
    },
    onSettled: invalidate,
  });
};

export const useSubmissionCancel = () => {
  const invalidate = useInvalidateSubmission();
  return useMutation(
    orpc.hackathon.submission.cancel.mutationOptions({ onSuccess: invalidate })
  );
};
