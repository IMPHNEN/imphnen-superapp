import { type Auth, type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { TActivityRepo } from '@app/activity';
import { DEFAULT_ROLE } from '@app/permissions';
import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';
import type { TDb } from '#/platform/db/client.ts';
import { match, P } from 'ts-pattern';
import { authPluginsOf } from '#/auth/infrastructure/auth-plugins.ts';
import { env } from '#/platform/config/env.ts';
import { originsOf } from '#/platform/http/origins.ts';
import {
  AUTH_DISABLED_PATHS,
  authRateLimitOf,
  CLIENT_IP_HEADER,
  emailOtpPluginOf,
} from '#/auth/infrastructure/auth-policy.ts';
import { sessionCreateGateOf } from '#/auth/infrastructure/account-gate.ts';
import { legacyPasswordUpgradeOf } from '#/auth/infrastructure/legacy-password-upgrade.ts';
import type { TOtpMail } from '#/auth/infrastructure/otp-mail.ts';
import { passwordVerifyOf } from '#/auth/infrastructure/password-verify.ts';

export type TPasswordResetMail = {
  readonly to: string;
  readonly name: string;
  readonly url: string;
};

type TCreateAuthOptions = {
  db: TDb;
  activityRepo: TActivityRepo;
  passwordResetSend: (mail: TPasswordResetMail) => Promise<void>;
  otpSend: (mail: TOtpMail) => Promise<void>;
  permissionsFor: (role: string) => Promise<readonly string[]>;
};

type TCrossSubDomainCookies = { enabled: boolean; domain?: string };

const crossSubDomainCookiesOf = (
  domain: string | undefined
): TCrossSubDomainCookies =>
  match(domain)
    .with(P.nullish, (): TCrossSubDomainCookies => ({ enabled: false }))
    .otherwise(
      (found): TCrossSubDomainCookies => ({ enabled: true, domain: found })
    );

type TSocialProviders = BetterAuthOptions['socialProviders'];

const socialProvidersOf = (
  clientId: string | undefined,
  clientSecret: string | undefined
): TSocialProviders =>
  match({ clientId, clientSecret })
    .with(
      { clientId: P.string, clientSecret: P.string },
      (found): TSocialProviders => ({
        google: {
          clientId: found.clientId,
          clientSecret: found.clientSecret,
        },
      })
    )
    .otherwise((): TSocialProviders => ({}));

type TAuthOptions = Omit<BetterAuthOptions, 'user'> & {
  user: {
    additionalFields: {
      role: { type: 'string'; defaultValue: string; input: false };
      isActive: { type: 'boolean'; defaultValue: boolean; input: false };
      deletedAt: { type: 'date'; required: false; input: false };
    };
  };
};

export type TAuth = Auth<TAuthOptions>;

export const authCreate = (deps: TCreateAuthOptions): TAuth =>
  betterAuth<TAuthOptions>({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [...originsOf(env.WEB_ORIGIN, env.AUTH_TRUSTED_ORIGINS)],
    database: drizzleAdapter(deps.db, { provider: 'sqlite' }),
    plugins: [
      ...authPluginsOf({
        jwtEnabled: false,
        issuer: env.BETTER_AUTH_URL,
        audience: env.BETTER_AUTH_URL,
        permissionsFor: deps.permissionsFor,
      }),
      emailOtpPluginOf(deps.otpSend),
    ],
    disabledPaths: AUTH_DISABLED_PATHS,
    rateLimit: authRateLimitOf(),
    advanced: {
      database: { generateId: (): string => crypto.randomUUID() },
      crossSubDomainCookies: crossSubDomainCookiesOf(env.AUTH_COOKIE_DOMAIN),
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
    socialProviders: socialProvidersOf(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    ),
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      password: {
        verify: passwordVerifyOf(legacyPasswordUpgradeOf(deps.db)),
      },
      sendResetPassword: async ({ user, url }): Promise<void> => {
        await deps.passwordResetSend({ to: user.email, name: user.name, url });
      },
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: DEFAULT_ROLE, input: false },
        isActive: { type: 'boolean', defaultValue: true, input: false },
        deletedAt: { type: 'date', required: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: sessionCreateGateOf(deps.db),
          after: async (session): Promise<void> => {
            await deps.activityRepo.insert({
              actorId: session.userId,
              action: ACTIVITY_ACTION.SESSION_CREATE,
              resourceType: ACTIVITY_RESOURCE_TYPE.SESSION,
              resourceId: session.id,
            });
          },
        },
      },
    },
  });
