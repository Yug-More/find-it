import type { SignInInput, SignUpInput } from "../src/types/auth";
import {
  hasAuthErrors,
  PASSWORD_MIN_LENGTH,
  validateSignIn,
  validateSignUp,
} from "../src/utils/authValidation";

function signUpInput(overrides: Partial<SignUpInput> = {}): SignUpInput {
  return {
    fullName: "Test User",
    email: "user@example.com",
    password: "password12",
    confirmPassword: "password12",
    ...overrides,
  };
}

function signInInput(overrides: Partial<SignInInput> = {}): SignInInput {
  return {
    email: "user@example.com",
    password: "password12",
    ...overrides,
  };
}

describe("validateSignIn", () => {
  it("accepts a trimmed email and a password", () => {
    const errors = validateSignIn(signInInput({ email: "  user@example.com  " }));
    expect(hasAuthErrors(errors)).toBe(false);
  });

  it("requires an email and a password", () => {
    const errors = validateSignIn(signInInput({ email: "  ", password: "" }));
    expect(errors.email).toBe("Enter your email.");
    expect(errors.password).toBe("Enter your password.");
  });

  it("rejects an email without a domain", () => {
    const errors = validateSignIn(signInInput({ email: "user@example" }));
    expect(errors.email).toBe("Enter a valid email address.");
  });
});

describe("validateSignUp", () => {
  it("accepts a complete sign-up", () => {
    expect(hasAuthErrors(validateSignUp(signUpInput()))).toBe(false);
  });

  it("requires every field", () => {
    const errors = validateSignUp(
      signUpInput({
        fullName: " ",
        email: "",
        password: "",
        confirmPassword: "",
      }),
    );

    expect(errors.fullName).toBe("Enter your full name.");
    expect(errors.email).toBe("Enter your email.");
    expect(errors.password).toBe("Enter a password.");
    expect(errors.confirmPassword).toBe("Confirm your password.");
  });

  it("rejects an invalid email", () => {
    expect(validateSignUp(signUpInput({ email: "not-an-email" })).email).toBe(
      "Enter a valid email address.",
    );
  });

  it("requires a password of at least 8 characters", () => {
    expect(validateSignUp(signUpInput({ password: "short", confirmPassword: "short" })).password).toBe(
      `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  });

  it("requires the password confirmation to match", () => {
    expect(
      validateSignUp(signUpInput({ confirmPassword: "password13" })).confirmPassword,
    ).toBe("Passwords do not match.");
  });

  it("trims the name before checking that it is present", () => {
    expect(validateSignUp(signUpInput({ fullName: "   " })).fullName).toBe("Enter your full name.");
    expect(hasAuthErrors(validateSignUp(signUpInput({ fullName: "  Test User  " })))).toBe(false);
  });
});
