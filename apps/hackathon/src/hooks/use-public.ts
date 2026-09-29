import { orpc } from '@imphnen-frontend-service/service/rpc';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { useQuery } from '@tanstack/react-query';

export const useWinners = () =>
  useQuery(orpc.hackathon.winner.list.queryOptions());

export const useCertificate = (id: string) =>
  useQuery({
    ...orpc.hackathon.certificate.get.queryOptions({
      input: { id },
      enabled: !!id,
    }),
    retry: false,
  });

export const useMyCertificate = () => {
  const { isAuthenticated } = useCurrentUser();
  return useQuery({
    ...orpc.hackathon.certificate.mine.queryOptions(),
    enabled: isAuthenticated,
  });
};
