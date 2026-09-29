import { describe, expect, it } from 'vitest';
import rootPackageJson from '../../../package.json' with { type: 'json' };
import { APP_VERSION } from './index.ts';

describe('APP_VERSION', () => {
  it('mirrors the root package.json version', (): void => {
    expect(APP_VERSION).toBe(rootPackageJson.version);
  });

  it('is a semver string', (): void => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
