import { MENTOR_DOCUMENT_KIND, type TMentorDocumentKind } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import type { TMentorRow } from '#/mentor/domain/mentor.ts';

export const MENTOR_DOCUMENT_MAX_BYTES = 5_242_880;

export const MENTOR_DOCUMENT_KEY_PREFIX = 'mentor';

export const MENTOR_DOCUMENT_KEY_SEPARATOR = '/';

export const MENTOR_DOCUMENT_FALLBACK_TYPE = 'application/octet-stream';

const MENTOR_DOCUMENT_EXTENSION: Readonly<Record<string, string>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const mentorDocumentExtensionOf = (
  contentType: string
): string | undefined =>
  D.get(MENTOR_DOCUMENT_EXTENSION, contentType) ?? undefined;

export const mentorDocumentKeyBuild = (
  kind: TMentorDocumentKind,
  extension: string
): string =>
  A.join(
    [MENTOR_DOCUMENT_KEY_PREFIX, kind, `${crypto.randomUUID()}.${extension}`],
    MENTOR_DOCUMENT_KEY_SEPARATOR
  );

export const mentorDocumentKeyOf = (
  row: TMentorRow,
  kind: TMentorDocumentKind
): string | null =>
  kind === MENTOR_DOCUMENT_KIND.CV ? row.cvKey : row.identityDocumentKey;

export const mentorDocumentFileName = (key: string): string =>
  A.last(key.split(MENTOR_DOCUMENT_KEY_SEPARATOR)) ?? key;
