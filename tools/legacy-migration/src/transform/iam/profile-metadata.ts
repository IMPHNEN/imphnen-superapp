import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import {
  JSON_EMPTY_ARRAY,
  jsonParse,
  jsonText,
} from '../../shared/json-text.ts';

export const PROFILE_TEXT_KEYS = [
  'phone_number',
  'phone_for_verification',
  'gender',
  'birthdate',
  'domicile',
  'bio',
  'last_education',
  'linkedin_url',
  'github_url',
  'cv_url',
  'portfolio_url',
  'website_url',
  'twitter_url',
  'location',
  'career_status',
] as const;

export type TProfileTextKey = (typeof PROFILE_TEXT_KEYS)[number];

const EXPERIENCE_KEYS = ['id', 'company', 'position', 'duration', 'period'];
const EDUCATION_KEYS = ['id', 'institution', 'degree', 'field', 'period'];
const LIST_KEY = {
  SKILLS: 'skills',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
} as const;

export type TProfileMetadata = {
  readonly text: Readonly<Record<TProfileTextKey, string | null>>;
  readonly skills: string;
  readonly experience: string;
  readonly education: string;
};

export const METADATA_PROBLEM = {
  NULL: 'metadata is NULL',
  NOT_JSON: 'metadata is not valid JSON',
  WRONG_SHAPE: 'metadata does not match the Rust profile shape',
} as const;

export type TMetadataProblem =
  (typeof METADATA_PROBLEM)[keyof typeof METADATA_PROBLEM];

export type TProfileMetadataParse = {
  readonly metadata: TProfileMetadata;
  readonly problem: TMetadataProblem | null;
};

type TRecord = Readonly<Record<string, unknown>>;

const EMPTY_TEXT = D.fromPairs(
  A.map(PROFILE_TEXT_KEYS, (key): readonly [TProfileTextKey, null] => [
    key,
    null,
  ])
) as Record<TProfileTextKey, string | null>;

export const EMPTY_PROFILE_METADATA: TProfileMetadata = {
  text: EMPTY_TEXT,
  skills: JSON_EMPTY_ARRAY,
  experience: JSON_EMPTY_ARRAY,
  education: JSON_EMPTY_ARRAY,
};

const isRecord = (value: unknown): value is TRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalText = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === 'string';

const hasStringKeys = (value: unknown, keys: readonly string[]): boolean =>
  isRecord(value) &&
  A.every(keys, (key): boolean => typeof value[key] === 'string');

const isOptionalList = (
  value: unknown,
  item: (element: unknown) => boolean
): boolean =>
  value === undefined ||
  value === null ||
  (Array.isArray(value) && A.every(value as readonly unknown[], item));

const matchesRustShape = (value: TRecord): boolean =>
  A.every(PROFILE_TEXT_KEYS, (key): boolean => isOptionalText(value[key])) &&
  isOptionalList(
    value[LIST_KEY.SKILLS],
    (item): boolean => typeof item === 'string'
  ) &&
  isOptionalList(value[LIST_KEY.EXPERIENCE], (item): boolean =>
    hasStringKeys(item, EXPERIENCE_KEYS)
  ) &&
  isOptionalList(value[LIST_KEY.EDUCATION], (item): boolean =>
    hasStringKeys(item, EDUCATION_KEYS)
  );

const pick = (item: unknown, keys: readonly string[]): TRecord =>
  D.fromPairs(
    A.map(keys, (key): readonly [string, unknown] => [
      key,
      (item as TRecord)[key],
    ])
  );

const listText = (value: unknown, keys: readonly string[] | null): string =>
  match(value)
    .with(P.array(), (items): string =>
      jsonText(
        keys === null
          ? items
          : A.map(items, (item): TRecord => pick(item, keys))
      )
    )
    .otherwise((): string => JSON_EMPTY_ARRAY);

const metadataOf = (value: TRecord): TProfileMetadata => ({
  text: D.fromPairs(
    A.map(
      PROFILE_TEXT_KEYS,
      (key): readonly [TProfileTextKey, string | null] => [
        key,
        typeof value[key] === 'string' ? (value[key] as string) : null,
      ]
    )
  ) as Record<TProfileTextKey, string | null>,
  skills: listText(value[LIST_KEY.SKILLS], null),
  experience: listText(value[LIST_KEY.EXPERIENCE], EXPERIENCE_KEYS),
  education: listText(value[LIST_KEY.EDUCATION], EDUCATION_KEYS),
});

const problemOf = (problem: TMetadataProblem): TProfileMetadataParse => ({
  metadata: EMPTY_PROFILE_METADATA,
  problem,
});

export const profileMetadataParse = (
  text: string | null
): TProfileMetadataParse =>
  match(text === null ? null : jsonParse(text))
    .with(
      P.nullish,
      (): TProfileMetadataParse => problemOf(METADATA_PROBLEM.NULL)
    )
    .with(
      { ok: true, value: P.nullish },
      (): TProfileMetadataParse => problemOf(METADATA_PROBLEM.NULL)
    )
    .with(
      { ok: true },
      (parsed): TProfileMetadataParse =>
        isRecord(parsed.value) && matchesRustShape(parsed.value)
          ? { metadata: metadataOf(parsed.value), problem: null }
          : problemOf(METADATA_PROBLEM.WRONG_SHAPE)
    )
    .otherwise(
      (): TProfileMetadataParse => problemOf(METADATA_PROBLEM.NOT_JSON)
    );

export const metadataRecordOf = (text: string | null): TRecord =>
  match(text === null ? null : jsonParse(text))
    .with(
      { ok: true, value: P.when(isRecord) },
      (parsed): TRecord => parsed.value as TRecord
    )
    .otherwise((): TRecord => ({}));
