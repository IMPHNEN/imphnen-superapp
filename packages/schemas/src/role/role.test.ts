import { VALIDATION_MESSAGE } from '@app/messages';
import { describe, expect, it } from 'vitest';
import { RESERVED_ROLE_KEY, roleCreateInputSchema } from './role.ts';

const LABEL = 'Reviewer';
const VALID_KEY = 'reviewer';

describe('roleCreateInputSchema', () => {
  it('accepts a well formed key', (): void => {
    const result = roleCreateInputSchema.safeParse({
      key: VALID_KEY,
      label: LABEL,
    });

    expect(result.success).toBe(true);
  });

  it("rejects the key that the create page's path takes", (): void => {
    const result = roleCreateInputSchema.safeParse({
      key: RESERVED_ROLE_KEY.CREATE,
      label: LABEL,
    });

    expect(result.error?.issues[0]?.message).toBe(
      VALIDATION_MESSAGE.ROLE_KEY_RESERVED
    );
  });
});
