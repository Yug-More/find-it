import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MISSING_SUPABASE_MESSAGE =
  "Sign-in is unavailable until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set. You can still browse reports.";

let client: SupabaseClient | null = null;

export function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function getSupabaseConfigError(): string | null {
  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    return MISSING_SUPABASE_MESSAGE;
  }
  return null;
}

// The anon key is the public client key. Never pass a service-role key or JWT secret here.
export function getSupabaseClient(): SupabaseClient | null {
  if (getSupabaseConfigError()) {
    return null;
  }

  if (!client) {
    try {
      client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    } catch {
      return null;
    }
  }

  return client;
}
