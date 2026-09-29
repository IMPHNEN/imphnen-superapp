import { ERROR_MESSAGE } from '@app/messages';
import { ORPCError } from '@orpc/server';
import { describe, expect, it } from 'vitest';
import { toORPCError } from '#/platform/orpc/error-mapping.ts';

const SECRET = 'connect ECONNREFUSED 10.0.3.14:5432 as user app_rw';

describe('toORPCError', () => {
  it('passes an oRPC error through untouched', (): void => {
    const original = new ORPCError('FORBIDDEN', { message: 'nope' });

    expect(toORPCError(original)).toBe(original);
  });

  it('never leaks the message of an unexpected error', (): void => {
    const mapped = toORPCError(new Error(SECRET));

    expect(mapped.code).toBe('INTERNAL_SERVER_ERROR');
    expect(mapped.message).toBe(ERROR_MESSAGE.INTERNAL);
    expect(mapped.message).not.toContain(SECRET);
  });

  it('maps a thrown non-error the same way', (): void => {
    const mapped = toORPCError(SECRET);

    expect(mapped.code).toBe('INTERNAL_SERVER_ERROR');
    expect(mapped.message).toBe(ERROR_MESSAGE.INTERNAL);
  });

  it('keeps the original as the cause for logging, and off the wire', (): void => {
    const original = new Error(SECRET);
    const mapped = toORPCError(original);

    expect(mapped.cause).toBe(original);
    expect(JSON.stringify(mapped.toJSON())).not.toContain(SECRET);
  });
});
