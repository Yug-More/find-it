import { signIn, signOut, signUp } from "../src/services/auth";
import { MISSING_SUPABASE_MESSAGE } from "../src/services/supabase";
import {
  getLastSignInEmail,
  getLastSignUp,
  getMockSession,
  setSignInError,
  setSignOutError,
  setSignUpNeedsConfirmation,
} from "./supabaseMock";

const signUpInput = {
  fullName: "  Test User  ",
  email: "  user@example.com  ",
  password: "password12",
  confirmPassword: "password12",
};

describe("auth service", () => {
  it("trims the email before signing in", async () => {
    const result = await signIn("  user@example.com  ", "password12");
    expect(result.ok).toBe(true);
    expect(getLastSignInEmail()).toBe("user@example.com");
  });

  it("returns the provider message when sign-in fails", async () => {
    setSignInError("Invalid login credentials");
    const result = await signIn("user@example.com", "password12");
    expect(result).toEqual({ ok: false, message: "Invalid login credentials" });
    expect(getMockSession()?.user.email).toBe("user@example.com");
  });

  it("trims the name and email before creating an account", async () => {
    const result = await signUp(signUpInput);
    expect(result.ok).toBe(true);
    expect(getLastSignUp()).toEqual({ email: "user@example.com", fullName: "Test User" });
  });

  it("asks the user to confirm an email when Supabase does not return a session", async () => {
    setSignUpNeedsConfirmation(true);
    const result = await signUp(signUpInput);
    expect(result).toEqual({
      ok: true,
      needsEmailConfirmation: true,
      session: null,
    });
  });

  it("returns a configuration message instead of calling Supabase when keys are missing", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const result = await signIn("user@example.com", "password12");
    expect(result).toEqual({ ok: false, message: MISSING_SUPABASE_MESSAGE });
  });

  it("keeps the session when sign-out fails", async () => {
    setSignOutError("Sign-out could not be completed.");
    const result = await signOut();
    expect(result).toEqual({ ok: false, message: "Sign-out could not be completed." });
    expect(getMockSession()).not.toBeNull();
  });
});
