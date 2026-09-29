import { MENTOR_STATUS, type TMentorStatus } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import {
  JSON_EMPTY_ARRAY,
  jsonParse,
  jsonText,
  stringElements,
} from '../../shared/json-text.ts';
import { blankToNull } from '../../shared/text.ts';

const LEGACY_MENTOR_STATUS = {
  VERIFIED: 'verified',
} as const;

export type TMentorStatusMapping = {
  readonly status: TMentorStatus;
  readonly known: boolean;
};

export const mentorStatusOf = (status: string | null): TMentorStatusMapping =>
  match(status === null ? '' : status.trim())
    .with(
      MENTOR_STATUS.PENDING,
      '',
      (): TMentorStatusMapping => ({
        status: MENTOR_STATUS.PENDING,
        known: true,
      })
    )
    .with(
      MENTOR_STATUS.ACTIVE,
      LEGACY_MENTOR_STATUS.VERIFIED,
      (): TMentorStatusMapping => ({
        status: MENTOR_STATUS.ACTIVE,
        known: true,
      })
    )
    .with(
      MENTOR_STATUS.REJECTED,
      (): TMentorStatusMapping => ({
        status: MENTOR_STATUS.REJECTED,
        known: true,
      })
    )
    .with(
      MENTOR_STATUS.INACTIVE,
      (): TMentorStatusMapping => ({
        status: MENTOR_STATUS.INACTIVE,
        known: true,
      })
    )
    .otherwise(
      (): TMentorStatusMapping => ({
        status: MENTOR_STATUS.INACTIVE,
        known: false,
      })
    );

export const menteeLevelText = (text: string | null): string =>
  match(blankToNull(text))
    .with(P.nullish, (): string => JSON_EMPTY_ARRAY)
    .otherwise((value): string =>
      match(jsonParse(value))
        .with({ ok: true, value: P.array() }, (parsed): string =>
          jsonText(stringElements(parsed.value as readonly unknown[]))
        )
        .with({ ok: true, value: P.string }, (parsed): string =>
          jsonText(
            A.filter([parsed.value.trim()], (item): boolean => item !== '')
          )
        )
        .with({ ok: true }, (): string => JSON_EMPTY_ARRAY)
        .otherwise((): string => jsonText([value.trim()]))
    );

export const metadataTextOf = (value: unknown): string | null =>
  match(value)
    .with(P.string, (text): string | null => blankToNull(text))
    .with(P.union(P.number, P.boolean), (scalar): string => String(scalar))
    .with(P.nullish, (): null => null)
    .otherwise((other): string => JSON.stringify(other));
