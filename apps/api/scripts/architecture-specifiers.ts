import { posix } from 'node:path';
import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';

export type TSpecifierSite = { line: number; specifier: string };

export const TARGET_KIND = {
  INSIDE: 'inside',
  ESCAPE: 'escape',
  PACKAGE: 'package',
} as const;

export type TResolvedSpecifier =
  | { kind: typeof TARGET_KIND.INSIDE; path: string }
  | { kind: typeof TARGET_KIND.ESCAPE; path: string }
  | { kind: typeof TARGET_KIND.PACKAGE };

const ABSOLUTE_PREFIX = '#/';
const RELATIVE_PREFIXES: readonly string[] = ['./', '../'];
const PARENT_SEGMENT = '..';

const LITERAL_SPECIFIER_PATTERNS: readonly RegExp[] = [
  /(?<![.\w$])from\s*["']([^"'\n]+)["']/g,
  /(?<![.\w$])import\s*["']([^"'\n]+)["']/g,
  /(?<![.\w$])import\s*\(\s*["']([^"'\n]+)["']/g,
  /(?<![.\w$])require\s*\(\s*["']([^"'\n]+)["']/g,
];

const UNCHECKED_SPECIFIER_PATTERNS: readonly RegExp[] = [
  /(?<![.\w$])import\s*\(\s*(?=[^\s"'])[^)\n]*\)?/g,
  /(?<![.\w$])require\s*\(\s*(?=[^\s"'])[^)\n]*\)?/g,
];

const lineOf = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length;

const sitesOf = (
  source: string,
  patterns: readonly RegExp[],
  specifierOf: (found: RegExpExecArray) => string | undefined
): readonly TSpecifierSite[] =>
  A.flat(
    A.map(patterns, (pattern) =>
      A.filterMap([...source.matchAll(new RegExp(pattern))], (found) => {
        const specifier = specifierOf(found);
        return specifier === undefined
          ? undefined
          : {
              line: lineOf(source, found.index + found[0].indexOf(specifier)),
              specifier,
            };
      })
    )
  );

export const specifiersOf = (source: string): readonly TSpecifierSite[] =>
  sitesOf(source, LITERAL_SPECIFIER_PATTERNS, (found) => found[1]);

export const uncheckedSpecifiersOf = (
  source: string
): readonly TSpecifierSite[] =>
  sitesOf(source, UNCHECKED_SPECIFIER_PATTERNS, (found) => found[0].trim());

const escapes = (path: string): boolean =>
  path === PARENT_SEGMENT || path.startsWith(`${PARENT_SEGMENT}/`);

const insideOrEscape = (path: string, escaped: boolean): TResolvedSpecifier =>
  escaped
    ? { kind: TARGET_KIND.ESCAPE, path }
    : { kind: TARGET_KIND.INSIDE, path };

const isRelative = (specifier: string): boolean =>
  A.some(RELATIVE_PREFIXES, (prefix) => specifier.startsWith(prefix));

export const resolveSpecifier = (
  file: string,
  specifier: string
): TResolvedSpecifier =>
  match(specifier)
    .when(
      (found): boolean => found.startsWith(ABSOLUTE_PREFIX),
      (found): TResolvedSpecifier => {
        const path = posix.normalize(found.slice(ABSOLUTE_PREFIX.length));
        return insideOrEscape(path, escapes(path));
      }
    )
    .when(isRelative, (found): TResolvedSpecifier => {
      const directory = posix.dirname(file);
      const path = posix.normalize(posix.join(directory, found));
      return insideOrEscape(
        path,
        escapes(path) || escapes(posix.relative(directory, path))
      );
    })
    .otherwise((): TResolvedSpecifier => ({ kind: TARGET_KIND.PACKAGE }));
