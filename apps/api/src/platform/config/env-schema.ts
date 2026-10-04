import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { z } from 'zod';
import { authEnvRefine } from '#/platform/config/auth-env-rules.ts';

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const;

const blankAsUndefined = (value: unknown): unknown =>
  match(value)
    .with('', (): undefined => undefined)
    .otherwise((found): unknown => found);

const stringListParse = (value: string): readonly string[] =>
  A.filterMap(value.split(','), (item): string | undefined => {
    const trimmed = item.trim();
    return trimmed === '' ? undefined : trimmed;
  });

export const envSchema = z
  .object({
    ENVIRONMENT: z
      .enum([ENVIRONMENT.DEVELOPMENT, ENVIRONMENT.PRODUCTION])
      .default(ENVIRONMENT.DEVELOPMENT),
    WEB_ORIGIN: z.url(),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    AUTH_COOKIE_DOMAIN: z.preprocess(
      blankAsUndefined,
      z.string().min(1).optional()
    ),
    AUTH_TRUSTED_ORIGINS: z.string().default('').transform(stringListParse),
    MAIL_FROM: z.string().min(1),
    STORAGE_PUBLIC_URL: z.url(),
    GOOGLE_CLIENT_ID: z.preprocess(blankAsUndefined, z.string().optional()),
    GOOGLE_CLIENT_SECRET: z.preprocess(blankAsUndefined, z.string().optional()),
    GITHUB_CLIENT_ID: z.preprocess(blankAsUndefined, z.string().optional()),
    GITHUB_CLIENT_SECRET: z.preprocess(blankAsUndefined, z.string().optional()),
  })
  .superRefine((env, context): void => {
    authEnvRefine(env, context, env.ENVIRONMENT === ENVIRONMENT.PRODUCTION);
  });

export type TEnv = z.infer<typeof envSchema>;

export const apiReferenceEnabledOf = (env: TEnv): boolean =>
  env.ENVIRONMENT !== ENVIRONMENT.PRODUCTION;
