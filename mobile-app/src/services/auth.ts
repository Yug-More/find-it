import type { User } from "@supabase/supabase-js";

import type { SignInResult, SignOutResult, SignUpInput, SignUpResult } from "../types/auth";
import { getSupabaseClient, getSupabaseConfigError, MISSING_SUPABASE_MESSAGE } from "./supabase";

export function readFullName(user: User | null | undefined): string | null {
  const value = user?.user_metadata?.full_name;
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { ok: false, message: configError };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: MISSING_SUPABASE_MESSAGE };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.session) {
    return {
      ok: false,
      message: error?.message || "Sign-in failed. Check your email and password.",
    };
  }

  return { ok: true, session: data.session };
}

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { ok: false, message: configError };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: MISSING_SUPABASE_MESSAGE };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.session) {
    return { ok: true, needsEmailConfirmation: true, session: null };
  }

  return { ok: true, needsEmailConfirmation: false, session: data.session };
}

export async function signOut(): Promise<SignOutResult> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { ok: false, message: configError };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: MISSING_SUPABASE_MESSAGE };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
