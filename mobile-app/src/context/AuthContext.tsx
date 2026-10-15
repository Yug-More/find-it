import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  signIn as signInAccount,
  signOut as signOutAccount,
  signUp as signUpAccount,
} from "../services/auth";
import { getSupabaseClient, getSupabaseConfigError } from "../services/supabase";
import type { SignInResult, SignOutResult, SignUpInput, SignUpResult } from "../types/auth";
import type { ItemType } from "../types/report";

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Sign in again to submit a report.";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configError: string | null;
  authMessage: string | null;
  pendingReportType: ItemType | null;
  setPendingReportType: (type: ItemType | null) => void;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<SignOutResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const CLIENT_START_MESSAGE =
  "Sign-in is unavailable because the Supabase client could not be started. You can still browse reports.";

function readAuthStartup(): { configError: string | null; loading: boolean } {
  const missingConfig = getSupabaseConfigError();
  if (missingConfig) {
    return { configError: missingConfig, loading: false };
  }
  if (!getSupabaseClient()) {
    return { configError: CLIENT_START_MESSAGE, loading: false };
  }
  return { configError: null, loading: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [startup] = useState(readAuthStartup);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(startup.loading);
  const [configError] = useState<string | null>(startup.configError);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [pendingReportType, setPendingReportType] = useState<ItemType | null>(null);
  const hadSession = useRef(false);
  const signingOut = useRef(false);

  const applySession = useCallback((next: Session | null) => {
    if (!next && hadSession.current && !signingOut.current) {
      setAuthMessage(SESSION_EXPIRED_MESSAGE);
    } else if (next || signingOut.current) {
      setAuthMessage(null);
    }

    signingOut.current = false;
    hadSession.current = Boolean(next);
    setSession(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (getSupabaseConfigError()) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) {
        return;
      }
      applySession(next);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }
      if (error) {
        setLoading(false);
        return;
      }
      applySession(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInAccount(email, password);
    if (result.ok) {
      hadSession.current = true;
      setAuthMessage(null);
      setSession(result.session);
    }
    return result;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await signUpAccount(input);
    if (result.ok && result.session) {
      hadSession.current = true;
      setAuthMessage(null);
      setSession(result.session);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    setPendingReportType(null);
    const result = await signOutAccount();
    if (!result.ok) {
      signingOut.current = false;
      return result;
    }
    hadSession.current = false;
    setAuthMessage(null);
    setSession(null);
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configError,
      authMessage,
      pendingReportType,
      setPendingReportType,
      signUp,
      signIn,
      signOut,
    }),
    [session, loading, configError, authMessage, pendingReportType, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
