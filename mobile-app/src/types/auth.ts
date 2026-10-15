import type { Session } from "@supabase/supabase-js";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignInField = keyof SignInInput;
export type SignUpField = keyof SignUpInput;

export type SignInFieldErrors = Partial<Record<SignInField, string>>;
export type SignUpFieldErrors = Partial<Record<SignUpField, string>>;

export type SignInResult = { ok: true; session: Session } | { ok: false; message: string };

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean; session: Session | null }
  | { ok: false; message: string };

export type SignOutResult = { ok: true } | { ok: false; message: string };
