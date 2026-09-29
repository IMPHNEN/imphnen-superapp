import { MENTOR_DOCUMENT_KIND } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentorDocumentUpload } from '#/mentor/application/mentor-document-upload.ts';
import {
  MENTOR_ID,
  MENTOR_USER_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { MENTOR_DOCUMENT_MAX_BYTES } from '#/mentor/domain/mentor-document.ts';
import { EBadRequest, ENotFound } from '#/shared/errors.ts';

const PDF = 'application/pdf';
const PREVIOUS_KEY = 'mentor/cv/previous.pdf';
const KEY_PATTERN = /^mentor\/cv\/[0-9a-f-]{36}\.pdf$/;

const fileOf = (type: string, size = 16): File =>
  new File([new Uint8Array(size)], 'cv.pdf', { type });

describe('mentorDocumentUpload', () => {
  it('stores a private key and removes the replaced object', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild({ cvKey: PREVIOUS_KEY }));

    const result = await Effect.runPromise(
      mentorDocumentUpload(
        { kind: MENTOR_DOCUMENT_KIND.CV, file: fileOf(PDF) },
        MENTOR_USER_ID
      ).pipe(Effect.provide(mentorLayerBuild(mocks)))
    );

    const [[, , key]] = mocks.documentKeySet.mock.calls;
    expect(key).toMatch(KEY_PATTERN);
    expect(mocks.documentKeySet).toHaveBeenCalledWith(
      MENTOR_ID,
      MENTOR_DOCUMENT_KIND.CV,
      key
    );
    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.objectContaining({ key, contentType: PDF })
    );
    expect(mocks.storageRemove).toHaveBeenCalledWith(PREVIOUS_KEY);
    expect(JSON.stringify(result)).not.toContain(key);
  });

  it('rejects a file type that is not a document or image', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());

    const error = await Effect.runPromise(
      mentorDocumentUpload(
        { kind: MENTOR_DOCUMENT_KIND.CV, file: fileOf('text/html') },
        MENTOR_USER_ID
      ).pipe(Effect.provide(mentorLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());

    const error = await Effect.runPromise(
      mentorDocumentUpload(
        {
          kind: MENTOR_DOCUMENT_KIND.IDENTITY,
          file: fileOf(PDF, MENTOR_DOCUMENT_MAX_BYTES + 1),
        },
        MENTOR_USER_ID
      ).pipe(Effect.provide(mentorLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it('requires an application first', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);

    const error = await Effect.runPromise(
      mentorDocumentUpload(
        { kind: MENTOR_DOCUMENT_KIND.CV, file: fileOf(PDF) },
        MENTOR_USER_ID
      ).pipe(Effect.provide(mentorLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
