import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_IMAGE_TYPE,
  HACKATHON_LIMIT,
  HACKATHON_STORAGE_PREFIX,
  HACKATHON_UPLOAD_KIND,
} from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { uploadCreate } from '#/hackathon/application/upload-create.ts';
import {
  failureAt,
  runAt,
} from '#/hackathon/application/testing/hackathon-fakes.ts';

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const FILE_NAME = 'logo.png';

const fileOf = (bytes: readonly number[], type: string): File =>
  new File([new Uint8Array(bytes)], FILE_NAME, { type });

describe('uploadCreate', () => {
  it('refuses a file larger than the limit', async (): Promise<void> => {
    const put = vi.fn();
    const big = new File(
      [new Uint8Array(HACKATHON_LIMIT.UPLOAD_MAX_BYTES + 1)],
      FILE_NAME
    );

    const error = await failureAt(
      uploadCreate({ kind: HACKATHON_UPLOAD_KIND.TEAM_LOGO, file: big }),
      { put }
    );

    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.UPLOAD_TOO_LARGE,
    });
    expect(put).not.toHaveBeenCalled();
  });

  it('refuses content that is not an image even when it claims to be one', async (): Promise<void> => {
    const error = await failureAt(
      uploadCreate({
        kind: HACKATHON_UPLOAD_KIND.TEAM_LOGO,
        file: fileOf([0x25, 0x50, 0x44, 0x46], HACKATHON_IMAGE_TYPE.PNG),
      }),
      {}
    );

    expect(error).toMatchObject({
      message: HACKATHON_MESSAGE.UPLOAD_TYPE_INVALID,
    });
  });

  it('stores the image under the entity prefix with the sniffed type', async (): Promise<void> => {
    const put = vi.fn((input: { key: string }) =>
      Effect.succeed(`https://cdn.test/${input.key}`)
    );

    const result = await runAt(
      uploadCreate({
        kind: HACKATHON_UPLOAD_KIND.SUBMISSION_SCREENSHOT,
        file: fileOf([...PNG_HEADER, 0, 0, 0, 0], HACKATHON_IMAGE_TYPE.GIF),
      }),
      { put }
    );

    expect(result.key.startsWith(HACKATHON_STORAGE_PREFIX.SUBMISSION)).toBe(
      true
    );
    expect(result.key.endsWith('.png')).toBe(true);
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: HACKATHON_IMAGE_TYPE.PNG })
    );
  });
});
