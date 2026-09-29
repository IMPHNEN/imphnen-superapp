import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export type TMentoringSession = TClientOutputs['mentoring']['get'];
export type TMentoringSessionStatus = TMentoringSession['status'];
export type TMentoringOverview = TClientOutputs['mentoring']['overview'];

export const useMentoringSessionList = (
  input: TClientInputs['mentoring']['manageList']
) =>
  useQuery(
    orpc.mentoring.manageList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useMentoringSession = (id: string) =>
  useQuery(orpc.mentoring.get.queryOptions({ input: { id }, retry: false }));

export const useMentoringOverview = () =>
  useQuery(orpc.mentoring.overview.queryOptions());
