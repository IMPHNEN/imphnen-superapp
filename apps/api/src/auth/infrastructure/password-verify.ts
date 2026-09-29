import { verifyPassword } from 'better-auth/crypto';
import { match } from 'ts-pattern';
import {
  isLegacyHash,
  legacyPasswordVerify,
} from '#/auth/infrastructure/legacy-password.ts';

export type TPasswordCheck = {
  readonly hash: string;
  readonly password: string;
};

export type TLegacyUpgrade = (
  legacyHash: string,
  password: string
) => Promise<void>;

export type TPasswordVerify = (check: TPasswordCheck) => Promise<boolean>;

const legacyVerify = async (
  check: TPasswordCheck,
  upgrade: TLegacyUpgrade
): Promise<boolean> => {
  const valid = await legacyPasswordVerify(check.hash, check.password);
  await (valid ? upgrade(check.hash, check.password) : Promise.resolve());
  return valid;
};

export const passwordVerifyOf =
  (upgrade: TLegacyUpgrade): TPasswordVerify =>
  (check): Promise<boolean> =>
    match(isLegacyHash(check.hash))
      .with(true, (): Promise<boolean> => legacyVerify(check, upgrade))
      .with(false, (): Promise<boolean> => verifyPassword(check))
      .exhaustive();
