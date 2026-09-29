import { match, P } from 'ts-pattern';

const UNIQUE_VIOLATION_MARKER = 'UNIQUE constraint failed';

export const isUniqueViolation = (cause: unknown): boolean =>
  match(cause)
    .with(
      { message: P.string.includes(UNIQUE_VIOLATION_MARKER) },
      (): boolean => true
    )
    .with({ cause: P.nonNullable }, (wrapped): boolean =>
      isUniqueViolation(wrapped.cause)
    )
    .otherwise((): boolean => false);
