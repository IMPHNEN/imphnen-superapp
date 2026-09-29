import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import type { z } from 'zod';

const AUTH_ENV_KEY = {
  AUTH_TRUSTED_ORIGINS: 'AUTH_TRUSTED_ORIGINS',
  AUTH_COOKIE_DOMAIN: 'AUTH_COOKIE_DOMAIN',
} as const;

const AUTH_ENV_MESSAGE = {
  TRUSTED_ORIGIN_SHAPE:
    'Every AUTH_TRUSTED_ORIGINS entry must be a lowercase origin with no path, and a wildcard must be the whole leftmost label followed by at least two labels, such as https://*.example.com.',
  TRUSTED_ORIGIN_HTTPS:
    'Every AUTH_TRUSTED_ORIGINS entry must start with https:// in production.',
  COOKIE_DOMAIN_SHAPE:
    "AUTH_COOKIE_DOMAIN must be a lowercase domain of at least two labels that BETTER_AUTH_URL's host belongs to.",
} as const;

const HTTPS_PREFIX = 'https://';
const SCHEME_SEPARATOR = '://';
const WILDCARD = '*';
const WILDCARD_LABEL = '*.';
const WILDCARD_STAND_IN = 'wildcard.';
const LABEL_SEPARATOR = '.';
const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const MIN_DOMAIN_LABELS = 2;
const MIN_WILDCARD_HOST_LABELS = MIN_DOMAIN_LABELS + 1;

type TAuthEnv = {
  BETTER_AUTH_URL: string;
  AUTH_COOKIE_DOMAIN?: string | undefined;
  AUTH_TRUSTED_ORIGINS: readonly string[];
};

const urlOf = (value: string): URL | undefined =>
  URL.canParse(value) ? new URL(value) : undefined;

const labelCount = (host: string): number => host.split(LABEL_SEPARATOR).length;

const exactOriginValid = (entry: string): boolean =>
  urlOf(entry)?.origin === entry;

const wildcardOriginValid = (entry: string): boolean => {
  const [scheme, rest = ''] = entry.split(SCHEME_SEPARATOR);
  const base = rest.slice(WILDCARD_LABEL.length);
  const standIn = `${scheme}${SCHEME_SEPARATOR}${WILDCARD_STAND_IN}${base}`;
  const url = urlOf(standIn);
  return (
    rest.startsWith(WILDCARD_LABEL) &&
    !base.includes(WILDCARD) &&
    url?.origin === standIn &&
    labelCount(url.hostname) >= MIN_WILDCARD_HOST_LABELS
  );
};

export const trustedOriginValid = (entry: string): boolean =>
  match(entry.includes(WILDCARD))
    .with(true, (): boolean => wildcardOriginValid(entry))
    .otherwise((): boolean => exactOriginValid(entry));

export const cookieDomainValid = (domain: string, authUrl: string): boolean => {
  const bare = domain.startsWith(LABEL_SEPARATOR) ? domain.slice(1) : domain;
  const host = urlOf(authUrl)?.hostname ?? '';
  return (
    DOMAIN_PATTERN.test(bare) &&
    labelCount(bare) >= MIN_DOMAIN_LABELS &&
    (host === bare || host.endsWith(`${LABEL_SEPARATOR}${bare}`))
  );
};

const issueWhen = (
  failed: boolean,
  context: z.RefinementCtx,
  key: string,
  message: string
): void =>
  match(failed)
    .with(true, (): void => {
      context.addIssue({ code: 'custom', path: [key], message });
    })
    .otherwise((): void => undefined);

export const authEnvRefine = (
  env: TAuthEnv,
  context: z.RefinementCtx,
  production: boolean
): void => {
  issueWhen(
    !A.every(env.AUTH_TRUSTED_ORIGINS, trustedOriginValid),
    context,
    AUTH_ENV_KEY.AUTH_TRUSTED_ORIGINS,
    AUTH_ENV_MESSAGE.TRUSTED_ORIGIN_SHAPE
  );
  issueWhen(
    production &&
      !A.every(env.AUTH_TRUSTED_ORIGINS, (origin) =>
        origin.startsWith(HTTPS_PREFIX)
      ),
    context,
    AUTH_ENV_KEY.AUTH_TRUSTED_ORIGINS,
    AUTH_ENV_MESSAGE.TRUSTED_ORIGIN_HTTPS
  );
  issueWhen(
    env.AUTH_COOKIE_DOMAIN !== undefined &&
      !cookieDomainValid(env.AUTH_COOKIE_DOMAIN, env.BETTER_AUTH_URL),
    context,
    AUTH_ENV_KEY.AUTH_COOKIE_DOMAIN,
    AUTH_ENV_MESSAGE.COOKIE_DOMAIN_SHAPE
  );
};
