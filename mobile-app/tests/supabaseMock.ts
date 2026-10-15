import type { Session, SupabaseClient } from "@supabase/supabase-js";

type AuthListener = (event: string, session: Session | null) => void;

type MockState = {
  session: Session | null;
  listeners: Set<AuthListener>;
  signInError: string | null;
  signUpError: string | null;
  signUpNeedsConfirmation: boolean;
  signOutError: string | null;
  getSessionError: string | null;
  signInCalls: number;
  signUpCalls: number;
  uploadError: string | null;
  uploadCalls: number;
  lastUploadPath: string | null;
  lastSignInEmail: string | null;
  lastSignUp: { email: string; fullName: string } | null;
};

const state: MockState = {
  session: null,
  listeners: new Set(),
  signInError: null,
  signUpError: null,
  signUpNeedsConfirmation: false,
  signOutError: null,
  getSessionError: null,
  signInCalls: 0,
  signUpCalls: 0,
  uploadError: null,
  uploadCalls: 0,
  lastUploadPath: null,
  lastSignInEmail: null,
  lastSignUp: null,
};

let gate: Promise<void> | null = null;
let releaseGate: (() => void) | null = null;
let subscribeCount = 0;
let unsubscribeCount = 0;

export function buildTestSession(options?: {
  email?: string;
  fullName?: string;
  accessToken?: string;
}): Session {
  const email = options?.email ?? "user@example.com";
  const fullName = options?.fullName ?? "Test User";
  const accessToken = options?.accessToken ?? "session-token";

  return {
    access_token: accessToken,
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: 1_900_000_000,
    token_type: "bearer",
    user: {
      id: "user-1",
      aud: "authenticated",
      email,
      app_metadata: {},
      user_metadata: { full_name: fullName },
      created_at: "2026-01-01T00:00:00.000Z",
    },
  } as Session;
}

export function resetSupabaseMock(): void {
  releaseGate?.();
  releaseGate = null;
  gate = null;
  subscribeCount = 0;
  unsubscribeCount = 0;
  state.session = buildTestSession();
  state.listeners.clear();
  state.signInError = null;
  state.signUpError = null;
  state.signUpNeedsConfirmation = false;
  state.signOutError = null;
  state.getSessionError = null;
  state.signInCalls = 0;
  state.signUpCalls = 0;
  state.uploadError = null;
  state.uploadCalls = 0;
  state.lastUploadPath = null;
  state.lastSignInEmail = null;
  state.lastSignUp = null;
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.EXPO_PUBLIC_API_URL = "http://localhost:8000";
  process.env.EXPO_PUBLIC_USE_MOCK = "true";
}

export function setMockSession(session: Session | null): void {
  state.session = session;
  emit(session ? "SIGNED_IN" : "SIGNED_OUT", session);
}

export function setSignInError(message: string | null): void {
  state.signInError = message;
}

export function setSignUpError(message: string | null): void {
  state.signUpError = message;
}

export function setSignUpNeedsConfirmation(value: boolean): void {
  state.signUpNeedsConfirmation = value;
}

export function setSignOutError(message: string | null): void {
  state.signOutError = message;
}

export function holdSessionRestore(): void {
  gate = new Promise((resolve) => {
    releaseGate = resolve;
  });
}

export function releaseSessionRestore(): void {
  const release = releaseGate;
  releaseGate = null;
  gate = null;
  release?.();
}

export function listenerCount(): number {
  return state.listeners.size;
}

export function authSubscriptionStats(): { listeners: number; subscribed: number; unsubscribed: number } {
  return {
    listeners: state.listeners.size,
    subscribed: subscribeCount,
    unsubscribed: unsubscribeCount,
  };
}

export function signInCallCount(): number {
  return state.signInCalls;
}

export function signUpCallCount(): number {
  return state.signUpCalls;
}

export function getLastSignInEmail(): string | null {
  return state.lastSignInEmail;
}

export function getLastSignUp(): { email: string; fullName: string } | null {
  return state.lastSignUp;
}

export function setUploadError(message: string | null): void {
  state.uploadError = message;
}

export function uploadCallCount(): number {
  return state.uploadCalls;
}

export function getLastUploadPath(): string | null {
  return state.lastUploadPath;
}

export function getMockSession(): Session | null {
  return state.session;
}

export function getSupabaseClient(): SupabaseClient {
  return {
    auth: {
      getSession: async () => {
        const pending = gate;
        if (pending) {
          await pending;
        }
        if (state.getSessionError) {
          return { data: { session: null }, error: { message: state.getSessionError } };
        }
        return { data: { session: state.session }, error: null };
      },
      onAuthStateChange: (callback: AuthListener) => {
        subscribeCount += 1;
        state.listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                unsubscribeCount += 1;
                state.listeners.delete(callback);
              },
            },
          },
        };
      },
      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        state.signInCalls += 1;
        state.lastSignInEmail = email;
        if (state.signInError) {
          return { data: { user: null, session: null }, error: { message: state.signInError } };
        }
        const session = buildTestSession({ email, fullName: "Test User" });
        state.session = session;
        emit("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      },
      signUp: async ({
        email,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string } };
      }) => {
        state.signUpCalls += 1;
        const fullName = options?.data?.full_name ?? "";
        state.lastSignUp = { email, fullName };
        if (state.signUpError) {
          return { data: { user: null, session: null }, error: { message: state.signUpError } };
        }
        if (state.signUpNeedsConfirmation) {
          const pendingUser = buildTestSession({ email, fullName }).user;
          return { data: { user: pendingUser, session: null }, error: null };
        }
        const session = buildTestSession({ email, fullName });
        state.session = session;
        emit("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      },
      signOut: async () => {
        if (state.signOutError) {
          return { error: { message: state.signOutError } };
        }
        state.session = null;
        emit("SIGNED_OUT", null);
        return { error: null };
      },
    },
    storage: {
      from: () => ({
        upload: async (path: string) => {
          state.uploadCalls += 1;
          state.lastUploadPath = path;
          if (state.uploadError) {
            return { data: null, error: { message: state.uploadError } };
          }
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://example.supabase.co/storage/v1/object/public/report-images/${path}`,
          },
        }),
      }),
    },
  } as unknown as SupabaseClient;
}

function emit(event: string, session: Session | null): void {
  for (const listener of [...state.listeners]) {
    listener(event, session);
  }
}
