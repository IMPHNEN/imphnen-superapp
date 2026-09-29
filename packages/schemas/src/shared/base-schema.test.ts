import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { baseSchema, eventSchema } from './base-schema.ts';

describe('baseSchema', () => {
  it('validates the shared record fields with a caller-provided ID schema', () => {
    const schema = baseSchema(z.string());

    expect(
      schema.safeParse({
        id: 'record-1',
        createdAt: '2027-01-01T00:00:00Z',
        updatedAt: '2027-01-01T00:00:00Z',
      })
    ).toMatchObject({ success: true });
  });

  it('rejects a record without an updated timestamp', () => {
    const schema = baseSchema(z.string());

    expect(
      schema.safeParse({
        id: 'record-1',
        createdAt: '2027-01-01T00:00:00Z',
      })
    ).toMatchObject({ success: false });
  });
});

describe('eventSchema', () => {
  it('validates an append-only record without an updated timestamp', () => {
    const schema = eventSchema(z.uuid());

    expect(
      schema.safeParse({
        id: '6f1d6d8a-1b3a-4f2f-9f3a-0f9c1f2b3c4d',
        createdAt: '2027-01-01T00:00:00Z',
      })
    ).toMatchObject({ success: true });
  });
});
