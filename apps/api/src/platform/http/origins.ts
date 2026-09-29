import { A } from '@mobily/ts-belt';

const WILDCARD = '*';
const WILDCARD_PATTERN = '[^/]*';
const REGEX_SPECIAL = /[.+?^${}()|[\]\\]/g;
const ESCAPED = '\\$&';

type TOriginMatcher = (origin: string) => boolean;

const patternToRegex = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern.replace(REGEX_SPECIAL, ESCAPED).replaceAll(WILDCARD, WILDCARD_PATTERN)}$`
  );

export const originsOf = (
  webOrigin: string,
  trusted: readonly string[]
): readonly string[] => A.uniq([webOrigin, ...trusted]);

export const originMatcherOf = (
  patterns: readonly string[]
): TOriginMatcher => {
  const compiled = A.map(patterns, patternToRegex);
  return (origin: string): boolean =>
    A.some(compiled, (regex) => regex.test(origin));
};
