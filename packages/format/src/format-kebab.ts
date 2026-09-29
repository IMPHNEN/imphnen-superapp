const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g;
const LEADING_HYPHENS = /^-+/;
const TRAILING_HYPHENS = /-+$/;
const HYPHEN = '-';
const NOTHING = '';

export const kebabCaseDraft = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, NOTHING)
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUN, HYPHEN)
    .replace(LEADING_HYPHENS, NOTHING);

export const kebabCase = (value: string): string =>
  kebabCaseDraft(value).replace(TRAILING_HYPHENS, NOTHING);
