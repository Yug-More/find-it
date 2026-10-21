import type { Session, User } from "@supabase/supabase-js";

/** Demo account used only when EXPO_PUBLIC_USE_MOCK=true. */
export const DEMO_USER_ID = "user-1";
export const DEMO_USER_EMAIL = "demo@findit.local";
export const DEMO_USER_NAME = "Demo Finder";

export function buildDemoSession(): Session {
  const user = {
    id: DEMO_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: DEMO_USER_EMAIL,
    email_confirmed_at: "2026-01-01T00:00:00.000Z",
    phone: "",
    confirmed_at: "2026-01-01T00:00:00.000Z",
    last_sign_in_at: "2026-01-01T00:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: DEMO_USER_NAME },
    identities: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    is_anonymous: false,
  } as User;

  return {
    access_token: "mock-demo-access-token",
    refresh_token: "mock-demo-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
}
