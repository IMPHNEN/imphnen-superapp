import { ACTIVITY_ACTION } from '@app/activity';
import { PROFILE_MESSAGE } from '@app/messages';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { EBadRequest, ENotFound } from '#/shared/errors.ts';
import { profileAvatarUpload } from '#/profile/application/profile-avatar-upload.ts';
import { AVATAR_MIME, AVATAR_POLICY } from '#/profile/domain/avatar-policy.ts';
import {
  PUBLIC_URL,
  profileLayerBuild,
  profileMocksBuild,
  profileRow,
  USER_ID,
} from '#/profile/application/profile-test-support.ts';

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PREVIOUS_KEY = 'profile/avatar/old.png';

const fileOf = (bytes: readonly number[], type: string, size = 0): File =>
  new File([new Uint8Array([...bytes, ...new Array(size).fill(0)])], 'a.png', {
    type,
  });

describe('profileAvatarUpload', () => {
  it('rejects a non-image type before touching storage', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow);

    const error = await Effect.runPromise(
      profileAvatarUpload(USER_ID, {
        file: fileOf(PNG_HEADER, 'application/pdf'),
      }).pipe(Effect.provide(profileLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toEqual(
      new EBadRequest({ message: PROFILE_MESSAGE.AVATAR_TYPE })
    );
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow);

    const error = await Effect.runPromise(
      profileAvatarUpload(USER_ID, {
        file: fileOf(PNG_HEADER, AVATAR_MIME.PNG, AVATAR_POLICY.MAX_BYTES),
      }).pipe(Effect.provide(profileLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toEqual(
      new EBadRequest({ message: PROFILE_MESSAGE.AVATAR_TOO_LARGE })
    );
  });

  it('rejects content that does not match the declared image type', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow);

    const error = await Effect.runPromise(
      profileAvatarUpload(USER_ID, {
        file: fileOf(PNG_HEADER, AVATAR_MIME.JPEG),
      }).pipe(Effect.provide(profileLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toEqual(
      new EBadRequest({ message: PROFILE_MESSAGE.AVATAR_CONTENT_MISMATCH })
    );
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('fails with ENotFound for a missing user without uploading', async (): Promise<void> => {
    const mocks = profileMocksBuild(null);

    const error = await Effect.runPromise(
      profileAvatarUpload(USER_ID, {
        file: fileOf(PNG_HEADER, AVATAR_MIME.PNG),
      }).pipe(Effect.provide(profileLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('stores the image, replaces the previous one and returns the new URL', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow, PREVIOUS_KEY);

    const result = await Effect.runPromise(
      profileAvatarUpload(USER_ID, {
        file: fileOf(PNG_HEADER, AVATAR_MIME.PNG),
      }).pipe(Effect.provide(profileLayerBuild(mocks)))
    );

    expect(result.image).toBe(PUBLIC_URL);
    expect(mocks.put).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.stringMatching(/^profile\/avatar\/[0-9a-f-]{36}\.png$/),
        contentType: AVATAR_MIME.PNG,
      })
    );
    expect(mocks.remove).toHaveBeenCalledWith(PREVIOUS_KEY);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.PROFILE_AVATAR_UPDATE })
    );
  });
});
