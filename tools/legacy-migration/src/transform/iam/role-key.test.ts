import { describe, expect, it } from 'vitest';
import { roleKeyOf } from './role-key.ts';

const NONE: ReadonlySet<string> = new Set();

describe('custom role key', () => {
  it('lowercases, strips accents and collapses separators', (): void => {
    expect(roleKeyOf('  Tim Kontén & Acara!! ', NONE)).toBe('tim-konten-acara');
  });

  it('prefixes keys that do not start with a letter or are too short', (): void => {
    expect(roleKeyOf('2024 Panitia', NONE)).toBe('role-2024-panitia');
    expect(roleKeyOf('X', NONE)).toBe('role-x');
    expect(roleKeyOf('***', NONE)).toBe('role');
  });

  it('never reuses a fixed role key, the reserved key or a taken key', (): void => {
    expect(roleKeyOf('Admin', NONE)).toBe('admin-2');
    expect(roleKeyOf('Create', NONE)).toBe('create-2');
    expect(roleKeyOf('Staf', new Set(['staf', 'staf-2']))).toBe('staf-3');
  });

  it('cuts keys to 50 characters, suffix included', (): void => {
    const long = 'a'.repeat(80);
    expect(roleKeyOf(long, NONE)).toHaveLength(50);
    expect(roleKeyOf(long, new Set(['a'.repeat(50)]))).toBe(
      `${'a'.repeat(48)}-2`
    );
  });
});
