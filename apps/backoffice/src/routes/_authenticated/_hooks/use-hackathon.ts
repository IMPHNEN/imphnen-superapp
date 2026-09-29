import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

type THackathonAdminListInput =
  TClientInputs['hackathon']['admin']['participantList'];

export type THackathonParticipant =
  TClientOutputs['hackathon']['admin']['participantList']['items'][number];
export type THackathonTeam =
  TClientOutputs['hackathon']['admin']['teamList']['items'][number];
export type THackathonSubmission =
  TClientOutputs['hackathon']['admin']['submissionList']['items'][number];
export type THackathonSubmissionStatus = THackathonSubmission['status'];
export type THackathonWinner =
  TClientOutputs['hackathon']['winner']['list']['items'][number];

export const useHackathonParticipantList = (input: THackathonAdminListInput) =>
  useQuery(
    orpc.hackathon.admin.participantList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useHackathonParticipant = (userId: string | undefined) =>
  useQuery(
    orpc.hackathon.participant.get.queryOptions({
      input: { userId: userId ?? '' },
      enabled: !!userId,
      retry: false,
    })
  );

export const useHackathonTeamList = (input: THackathonAdminListInput) =>
  useQuery(
    orpc.hackathon.admin.teamList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useHackathonTeam = (id: string | undefined) =>
  useQuery(
    orpc.hackathon.team.get.queryOptions({
      input: { id: id ?? '' },
      enabled: !!id,
      retry: false,
    })
  );

export const useHackathonTeamRemove = () => {
  const invalidate = useInvalidate(orpc.hackathon.key());
  return useMutation(
    orpc.hackathon.admin.teamRemove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useHackathonSubmissionList = (
  input: TClientInputs['hackathon']['admin']['submissionList']
) =>
  useQuery(
    orpc.hackathon.admin.submissionList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useHackathonWinnerList = () =>
  useQuery(orpc.hackathon.winner.list.queryOptions());

export const useHackathonWinnerSet = () => {
  const invalidate = useInvalidate(orpc.hackathon.winner.key());
  return useMutation(
    orpc.hackathon.admin.winnerSet.mutationOptions({ onSuccess: invalidate })
  );
};

export const useHackathonWinnerRemove = () => {
  const invalidate = useInvalidate(orpc.hackathon.winner.key());
  return useMutation(
    orpc.hackathon.admin.winnerRemove.mutationOptions({
      onSuccess: invalidate,
    })
  );
};
