import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_DETAIL,
  activityDetailList,
  activityDetailPrevious,
  activityDetails,
} from './details.ts';

const LABEL = 'Reviewer';

describe('activityDetails', () => {
  it('drops the details that were left undefined', (): void => {
    expect(
      activityDetails({
        [ACTIVITY_DETAIL.LABEL]: LABEL,
        [ACTIVITY_DETAIL.PREVIOUS_LABEL]: undefined,
      })
    ).toEqual({ [ACTIVITY_DETAIL.LABEL]: LABEL });
  });

  it('keeps a zero and a false, which are values rather than gaps', (): void => {
    expect(
      activityDetails({
        [ACTIVITY_DETAIL.PERMISSION_COUNT]: 0,
        [ACTIVITY_DETAIL.TITLE]: null,
      })
    ).toEqual({
      [ACTIVITY_DETAIL.PERMISSION_COUNT]: 0,
      [ACTIVITY_DETAIL.TITLE]: null,
    });
  });
});

describe('activityDetailList', () => {
  it('joins values with a comma and leaves an empty list out', (): void => {
    expect(activityDetailList(['note:read', 'user:delete'])).toBe(
      'note:read, user:delete'
    );
    expect(activityDetailList([])).toBeUndefined();
  });
});

describe('activityDetailPrevious', () => {
  it('returns the previous value only when it changed', (): void => {
    expect(activityDetailPrevious('member', 'viewer')).toBe('member');
    expect(activityDetailPrevious('member', 'member')).toBeUndefined();
  });
});
