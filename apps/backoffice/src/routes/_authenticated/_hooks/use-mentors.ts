import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useInvalidate } from './use-invalidate';

export type TMentorPrivate = TClientOutputs['mentor']['reviewGet'];
export type TMentorStatus = TMentorPrivate['status'];
export type TMentorDocumentKind =
  TClientInputs['mentor']['documentDownload']['kind'];

const saveFile = (file: File): void => {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const useMentorPublicList = (input: TClientInputs['mentor']['list']) =>
  useQuery(orpc.mentor.list.queryOptions({ input }));

export const useMentorReviewList = (
  input: TClientInputs['mentor']['reviewList']
) =>
  useQuery(
    orpc.mentor.reviewList.queryOptions({
      input,
      placeholderData: keepPreviousData,
    })
  );

export const useMentorReview = (id: string, enabled = true) =>
  useQuery(
    orpc.mentor.reviewGet.queryOptions({
      input: { id },
      enabled,
      retry: false,
    })
  );

export const useMentorVerify = () => {
  const invalidate = useInvalidate(orpc.mentor.key(), orpc.user.key());
  return useMutation(
    orpc.mentor.verify.mutationOptions({ onSuccess: invalidate })
  );
};

export const useMentorRemove = () => {
  const invalidate = useInvalidate(orpc.mentor.key(), orpc.user.key());
  return useMutation(
    orpc.mentor.remove.mutationOptions({ onSuccess: invalidate })
  );
};

export const useMentorDocumentDownload = () =>
  useMutation(
    orpc.mentor.documentDownload.mutationOptions({ onSuccess: saveFile })
  );
