import { A } from '@mobily/ts-belt';

const PARAGRAPH_SEPARATOR = '\n\n';
const NO_SEPARATOR = '';

export const mailTextBuild = (lines: readonly string[]): string =>
  A.join(lines, PARAGRAPH_SEPARATOR);

export const mailHtmlBuild = (lines: readonly string[]): string =>
  A.join(
    A.map(lines, (line): string => `<p>${line}</p>`),
    NO_SEPARATOR
  );

export const mailLinkBuild = (label: string, url: string): string =>
  `<a href="${url}">${label}</a>`;
