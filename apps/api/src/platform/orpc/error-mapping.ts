import { ERROR_MESSAGE } from '@app/messages';
import { ORPCError } from '@orpc/server';
import { match, P } from 'ts-pattern';

const internalError = (cause: unknown): ORPCError<string, undefined> =>
  new ORPCError('INTERNAL_SERVER_ERROR', {
    message: ERROR_MESSAGE.INTERNAL,
    cause,
  });

export const toORPCError = (error: unknown): ORPCError<string, undefined> =>
  match(error)
    .with(
      P.instanceOf(ORPCError),
      (e): ORPCError<string, undefined> => e as ORPCError<string, undefined>
    )
    .otherwise(internalError);
