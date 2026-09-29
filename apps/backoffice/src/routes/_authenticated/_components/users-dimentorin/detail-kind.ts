export const DETAIL_KIND = {
  MENTOR: 'mentor',
  USER: 'user',
} as const;

export type TDetailKind = (typeof DETAIL_KIND)[keyof typeof DETAIL_KIND];

export const detailKindOf = (value: unknown): TDetailKind =>
  value === DETAIL_KIND.USER ? DETAIL_KIND.USER : DETAIL_KIND.MENTOR;
