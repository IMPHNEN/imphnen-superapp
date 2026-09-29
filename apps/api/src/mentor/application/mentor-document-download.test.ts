import { MENTOR_DOCUMENT_KIND } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentorDocumentDownload } from '#/mentor/application/mentor-document-download.ts';
import {
  MENTOR_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { ENotFound } from '#/shared/errors.ts';

const KEY = 'mentor/identity/doc.png';
const PNG = 'image/png';

const input = { id: MENTOR_ID, kind: MENTOR_DOCUMENT_KIND.IDENTITY };

describe('mentorDocumentDownload', () => {
  it('streams the private object back as a file', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({ identityDocumentKey: KEY })
    );
    mocks.storageGet.mockReturnValue(
      Effect.succeed({
        arrayBuffer: (): Promise<ArrayBuffer> =>
          Promise.resolve(new ArrayBuffer(4)),
        httpMetadata: { contentType: PNG },
      })
    );

    const file = await Effect.runPromise(
      mentorDocumentDownload(input).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(mocks.storageGet).toHaveBeenCalledWith(KEY);
    expect(file.type).toBe(PNG);
    expect(file.size).toBe(4);
  });

  it('fails with ENotFound when no document was uploaded', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());

    const error = await Effect.runPromise(
      mentorDocumentDownload(input).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });
});
