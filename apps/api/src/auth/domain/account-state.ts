export type TAccountState = {
  readonly isActive: boolean;
  readonly deletedAt: Date | null;
};

export const accountUsable = (state: TAccountState | null): boolean =>
  state?.isActive === true && state.deletedAt === null;
