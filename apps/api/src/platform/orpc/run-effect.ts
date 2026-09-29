import { ERROR_MESSAGE } from '@app/messages';
import { ORPCError } from '@orpc/server';
import { Effect } from 'effect';
import { match, P } from 'ts-pattern';
import { ERROR_TAG } from '#/shared/error-tags.ts';
import type { TDomainError } from '#/shared/errors.ts';
import type { TAppRuntime, TAppRuntimeServices } from '#/bootstrap/compose.ts';

const toORPCError = (error: TDomainError): ORPCError<string, undefined> =>
  match(error)
    .with(
      { _tag: ERROR_TAG.NOT_FOUND },
      (e): ORPCError<string, undefined> =>
        new ORPCError('NOT_FOUND', { message: e.message })
    )
    .with(
      { _tag: ERROR_TAG.FORBIDDEN },
      (e): ORPCError<string, undefined> =>
        new ORPCError('FORBIDDEN', { message: e.message })
    )
    .with(
      { _tag: ERROR_TAG.UNAUTHORIZED },
      (e): ORPCError<string, undefined> =>
        new ORPCError('UNAUTHORIZED', { message: e.message })
    )
    .with(
      { _tag: ERROR_TAG.CONFLICT },
      (e): ORPCError<string, undefined> =>
        new ORPCError('CONFLICT', { message: e.message })
    )
    .with(
      { _tag: ERROR_TAG.BAD_REQUEST },
      (e): ORPCError<string, undefined> =>
        new ORPCError('BAD_REQUEST', { message: e.message })
    )
    .with(
      {
        _tag: P.union(
          ERROR_TAG.DATABASE,
          ERROR_TAG.AUTH,
          ERROR_TAG.MAIL,
          ERROR_TAG.STORAGE
        ),
      },
      (): ORPCError<string, undefined> =>
        new ORPCError('INTERNAL_SERVER_ERROR', {
          message: ERROR_MESSAGE.INTERNAL,
        })
    )
    .exhaustive();

type TResult<A> =
  | { readonly _tag: 'success'; readonly value: A }
  | { readonly _tag: 'failure'; readonly error: TDomainError };

export const effectRun = async <A>(
  runtime: TAppRuntime,
  effect: Effect.Effect<A, TDomainError, TAppRuntimeServices>
): Promise<A> => {
  const result = await runtime.runPromise(
    effect.pipe(
      Effect.map((value): TResult<A> => ({ _tag: 'success', value })),
      Effect.catch(
        (error): Effect.Effect<TResult<A>> =>
          Effect.succeed({ _tag: 'failure', error })
      )
    )
  );

  return match(result)
    .with({ _tag: 'success' }, ({ value }) => value)
    .with({ _tag: 'failure' }, ({ error }): never => {
      throw toORPCError(error);
    })
    .exhaustive();
};
