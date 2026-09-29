import { PERMISSION, ROLE } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import type { jwt } from 'better-auth/plugins';
import { describe, expect, it, vi } from 'vitest';
import {
  authPluginsOf,
  JWT_POLICY,
} from '#/auth/infrastructure/auth-plugins.ts';

const USER = { id: 'u1', email: 'a@b.test', name: 'A', role: ROLE.ADMIN };
const SESSION = { id: 's1' };
const AUTH_URL = 'https://api.example.test';
const JWT_PLUGIN_ID = 'jwt';

type TJwtPlugin = ReturnType<typeof jwt>;

const permissionsFor = vi.fn(
  async (): Promise<readonly string[]> => [PERMISSION.USER_UPDATE]
);

const OPTIONS = {
  jwtEnabled: true,
  issuer: AUTH_URL,
  audience: AUTH_URL,
  permissionsFor,
};

const jwtPluginOf = (
  plugins: ReturnType<typeof authPluginsOf>
): TJwtPlugin | undefined =>
  A.find(plugins, (plugin) => plugin.id === JWT_PLUGIN_ID) as
    | TJwtPlugin
    | undefined;

describe('authPluginsOf', () => {
  it('adds nothing while JWT issuing is off', (): void => {
    expect(authPluginsOf({ ...OPTIONS, jwtEnabled: false })).toEqual([]);
  });

  it('adds only the jwt plugin, never one that exposes the session token', (): void => {
    const ids = A.map(authPluginsOf(OPTIONS), (plugin) => plugin.id);

    expect(ids).toEqual([JWT_PLUGIN_ID]);
  });

  it('does not sign a token on every session read', (): void => {
    const plugin = jwtPluginOf(authPluginsOf(OPTIONS));

    expect(plugin?.options?.disableSettingJwtHeader).toBe(true);
  });

  it('pins lifetime, issuer, audience and key rotation rather than library defaults', (): void => {
    const options = jwtPluginOf(authPluginsOf(OPTIONS))?.options;

    expect(options?.jwt?.expirationTime).toBe(JWT_POLICY.EXPIRATION_TIME);
    expect(options?.jwt?.issuer).toBe(AUTH_URL);
    expect(options?.jwt?.audience).toBe(AUTH_URL);
    expect(options?.jwks?.rotationInterval).toBe(
      JWT_POLICY.KEY_ROTATION_SECONDS
    );
    expect(options?.jwks?.gracePeriod).toBe(JWT_POLICY.KEY_GRACE_SECONDS);
  });

  it('puts the role and its resolved permissions in the token payload', async (): Promise<void> => {
    const plugin = jwtPluginOf(authPluginsOf(OPTIONS));

    const payload = await plugin?.options?.jwt?.definePayload?.({
      user: USER as never,
      session: SESSION as never,
    });

    expect(permissionsFor).toHaveBeenCalledWith(ROLE.ADMIN);
    expect(payload).toEqual({
      id: USER.id,
      email: USER.email,
      name: USER.name,
      role: ROLE.ADMIN,
      permissions: [PERMISSION.USER_UPDATE],
    });
  });

  it('falls back to the viewer role when the user carries none', async (): Promise<void> => {
    const plugin = jwtPluginOf(authPluginsOf(OPTIONS));

    const payload = await plugin?.options?.jwt?.definePayload?.({
      user: { ...USER, role: undefined } as never,
      session: SESSION as never,
    });

    expect(payload?.role).toBe(ROLE.VIEWER);
  });
});
