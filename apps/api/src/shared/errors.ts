import { Schema } from 'effect';
import { ERROR_TAG } from '#/shared/error-tags.ts';

export class ENotFound extends Schema.TaggedError<ENotFound>()(
  ERROR_TAG.NOT_FOUND,
  {
    message: Schema.String,
  }
) {}

export class EForbidden extends Schema.TaggedError<EForbidden>()(
  ERROR_TAG.FORBIDDEN,
  {
    message: Schema.String,
  }
) {}

export class EUnauthorized extends Schema.TaggedError<EUnauthorized>()(
  ERROR_TAG.UNAUTHORIZED,
  {
    message: Schema.String,
  }
) {}

export class EConflict extends Schema.TaggedError<EConflict>()(
  ERROR_TAG.CONFLICT,
  {
    message: Schema.String,
  }
) {}

export class EBadRequest extends Schema.TaggedError<EBadRequest>()(
  ERROR_TAG.BAD_REQUEST,
  {
    message: Schema.String,
  }
) {}

export class EDatabase extends Schema.TaggedError<EDatabase>()(
  ERROR_TAG.DATABASE,
  {
    cause: Schema.Defect(),
  }
) {}

export class EAuth extends Schema.TaggedError<EAuth>()(ERROR_TAG.AUTH, {
  cause: Schema.Defect(),
}) {}

export class EMail extends Schema.TaggedError<EMail>()(ERROR_TAG.MAIL, {
  cause: Schema.Defect(),
}) {}

export class EStorage extends Schema.TaggedError<EStorage>()(
  ERROR_TAG.STORAGE,
  {
    cause: Schema.Defect(),
  }
) {}

export type TDomainError =
  | ENotFound
  | EForbidden
  | EUnauthorized
  | EConflict
  | EBadRequest
  | EDatabase
  | EAuth
  | EMail
  | EStorage;
