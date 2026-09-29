import { readFileSync } from 'node:fs';
import { A, D } from '@mobily/ts-belt';
import {
  type AnyProcedure,
  call,
  isProcedure,
  type ORPCError,
} from '@orpc/server';
import { match } from 'ts-pattern';
import { describe, expect, it, vi } from 'vitest';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import { SESSION_STATE, type TSession } from '#/shared/session.ts';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const PATH_SEPARATOR = '.';
const ENV_SEPARATOR = '=';
const ENV_COMMENT = '#';
const NOT_FOUND_INDEX = -1;
const EXAMPLE_ENV_PATH = new URL('../../.dev.vars.example', import.meta.url)
  .pathname;

const envEntryOf = (line: string): readonly [string, string] | undefined => {
  const trimmed = line.trim();
  const separator = trimmed.indexOf(ENV_SEPARATOR);
  const value = trimmed
    .slice(separator + ENV_SEPARATOR.length)
    .replace(/^"|"$/g, '');

  return match({
    skip: trimmed.startsWith(ENV_COMMENT) || value === '',
    separator,
  })
    .with({ skip: true }, (): undefined => undefined)
    .with({ separator: NOT_FOUND_INDEX }, (): undefined => undefined)
    .otherwise((): readonly [string, string] => [
      trimmed.slice(0, separator),
      value,
    ]);
};

A.forEach(
  A.filterMap(readFileSync(EXAMPLE_ENV_PATH, 'utf8').split('\n'), envEntryOf),
  ([key, value]) => vi.stubEnv(key, value)
);

const { routerBuild } = await import('#/bootstrap/router.ts');

const PUBLIC_PROCEDURES: readonly string[] = ['health.check'];
const SESSION_ONLY_PROCEDURES: readonly string[] = [
  'me.get',
  'profile.get',
  'profile.update',
  'profile.avatarUpload',
  'testimonial.update',
  'testimonial.remove',
  'qr.activeCampaign',
  'qr.watermark',
];
const PUBLIC_DATA_PROCEDURES: readonly string[] = [
  'event.list',
  'event.get',
  'testimonial.list',
  'testimonial.get',
  'roadmap.list',
  'roadmap.get',
  'mentor.list',
  'mentor.get',
  'mentor.getByUser',
  'mentoring.availability',
  'hackathon.team.browse',
  'hackathon.team.get',
  'hackathon.winner.list',
  'hackathon.certificate.get',
];

const SESSION: TSession = {
  user: { id: 'u1', email: 'a@b.test', name: 'A', role: 'viewer' },
  permissions: [],
};

type TNamedProcedure = { name: string; procedure: AnyProcedure };

const proceduresOf = (
  node: unknown,
  path: readonly string[]
): readonly TNamedProcedure[] =>
  isProcedure(node)
    ? [{ name: A.join(path, PATH_SEPARATOR), procedure: node }]
    : A.flat(
        A.map(D.toPairs(node as Record<string, unknown>), ([key, value]) =>
          proceduresOf(value, [...path, key])
        )
      );

const procedures = proceduresOf(routerBuild(), []);

const contextOf = (session: TSession | null): TORPCContext =>
  ({
    headers: new Headers(),
    session,
    sessionState:
      session === null ? SESSION_STATE.ANONYMOUS : SESSION_STATE.RESOLVED,
    permissions: session?.permissions ?? [],
  }) as unknown as TORPCContext;

const statusOf = (
  procedure: AnyProcedure,
  context: TORPCContext
): Promise<number | undefined> =>
  call(procedure, undefined, { context }).then(
    (): undefined => undefined,
    (error: ORPCError<string, unknown>): number => error.status
  );

const statusesOf = (
  selected: readonly TNamedProcedure[],
  context: TORPCContext
): Promise<readonly (readonly [string, number | undefined])[]> =>
  Promise.all(
    A.map(
      selected,
      async (found): Promise<readonly [string, number | undefined]> => [
        found.name,
        await statusOf(found.procedure, context),
      ]
    )
  );

const expectedStatuses = (
  selected: readonly TNamedProcedure[],
  status: number
): readonly (readonly [string, number])[] =>
  A.map(selected, (found): readonly [string, number] => [found.name, status]);

const isListed = (names: readonly string[]) => (found: TNamedProcedure) =>
  A.includes(names, found.name);

describe('app router gates', () => {
  it('walks every procedure of the router', (): void => {
    expect(A.map(procedures, (found) => found.name)).toEqual(
      expect.arrayContaining([
        'health.check',
        'me.get',
        'user.create',
        'role.remove',
        'activity.list',
        'permission.list',
      ])
    );
  });

  it('rejects an anonymous caller on every procedure that is not public', async (): Promise<void> => {
    const guarded = A.reject(
      procedures,
      isListed([...PUBLIC_PROCEDURES, ...PUBLIC_DATA_PROCEDURES])
    );

    expect(await statusesOf(guarded, contextOf(null))).toEqual(
      expectedStatuses(guarded, HTTP_UNAUTHORIZED)
    );
  });

  it('rejects a session without permissions on every procedure that touches data', async (): Promise<void> => {
    const guarded = A.reject(
      procedures,
      isListed([
        ...PUBLIC_PROCEDURES,
        ...PUBLIC_DATA_PROCEDURES,
        ...SESSION_ONLY_PROCEDURES,
      ])
    );

    expect(await statusesOf(guarded, contextOf(SESSION))).toEqual(
      expectedStatuses(guarded, HTTP_FORBIDDEN)
    );
  });

  it('answers the public procedures without any session', async (): Promise<void> => {
    const open = A.filter(procedures, isListed(PUBLIC_PROCEDURES));

    expect(await statusesOf(open, contextOf(null))).toEqual(
      A.map(open, (found): readonly [string, undefined] => [
        found.name,
        undefined,
      ])
    );
  });
});
