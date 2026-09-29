import type { z } from 'zod';
import type { authLoginSchema, authRegisterSchema } from '../../schemas';
import type { TResponseDetail, TResponseMessage } from '../common';
import type { TUserItem } from '../users';

export type TTokenItem = {
  access_token: string;
  refresh_token: string;
};

export type TLoginItem = {
  token?: TTokenItem;
  user?: TUserItem;
};

export type TLoginRequest = z.infer<typeof authLoginSchema>;
export type TLoginResponse = TResponseDetail<TLoginItem>;

export type TRegisterRequest = z.infer<typeof authRegisterSchema>;
export type TRegisterResponse = TResponseDetail<TResponseMessage>;

export type TVerifyOtpRequest = {
  otp: string;
};

export type TVerifyEmailRequest = {
  email: string;
  otp: string;
};

export type TSendOTPRequest = {
  email: string;
};

export type TGoogleCallbackResponse = {
  token: TTokenItem;
  user: TUserItem;
};
