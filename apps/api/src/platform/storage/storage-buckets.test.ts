import { describe, expect, it, vi } from 'vitest';

vi.mock('#/platform/config/env.ts', () => ({ bindings: {}, env: {} }));

const { isPrivateKey } = await import('#/platform/storage/storage-buckets.ts');

describe('isPrivateKey', () => {
  it('keeps mentor documents private', (): void => {
    expect(isPrivateKey('mentor/identity/doc.png')).toBe(true);
    expect(isPrivateKey('mentor/cv/cv.pdf')).toBe(true);
  });

  it('leaves avatars and hackathon assets public', (): void => {
    expect(isPrivateKey('profile/avatar/a.png')).toBe(false);
    expect(isPrivateKey('hackathon/team/logo.png')).toBe(false);
  });
});
