import { ROLE } from '@app/permissions';
import { RESERVED_ROLE_KEY } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { cut } from '../../shared/text.ts';

const KEY_MAX = 50;
const KEY_MIN = 2;
const SEPARATOR = '-';
const PREFIX = 'role';
const FIRST_SUFFIX = 2;
const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g;
const EDGE_SEPARATORS = /^-+|-+$/g;
const STARTS_WITH_LETTER = /^[a-z]/;
const NORMAL_FORM = 'NFKD';

const RESERVED_KEYS: readonly string[] = A.concat(
  D.values(ROLE),
  D.values(RESERVED_ROLE_KEY)
);

const slugOf = (name: string): string =>
  cut(
    name
      .normalize(NORMAL_FORM)
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(NON_ALPHANUMERIC_RUN, SEPARATOR)
      .replace(EDGE_SEPARATORS, ''),
    KEY_MAX
  );

const prefixed = (slug: string): string =>
  match(slug)
    .when(
      (value): boolean =>
        STARTS_WITH_LETTER.test(value) && value.length >= KEY_MIN,
      (value): string => value
    )
    .with('', (): string => PREFIX)
    .otherwise((value): string =>
      cut(`${PREFIX}${SEPARATOR}${value}`, KEY_MAX)
    );

const isTaken = (key: string, taken: ReadonlySet<string>): boolean =>
  taken.has(key) || A.includes(RESERVED_KEYS, key);

const withSuffix = (base: string, suffix: number): string => {
  const tail = `${SEPARATOR}${suffix}`;
  return `${cut(base, KEY_MAX - tail.length)}${tail}`;
};

const firstFree = (
  base: string,
  taken: ReadonlySet<string>,
  suffix: number
): string => {
  const candidate = withSuffix(base, suffix);
  return isTaken(candidate, taken)
    ? firstFree(base, taken, suffix + 1)
    : candidate;
};

export const roleKeyOf = (name: string, taken: ReadonlySet<string>): string => {
  const base = prefixed(slugOf(name));
  return isTaken(base, taken) ? firstFree(base, taken, FIRST_SUFFIX) : base;
};
