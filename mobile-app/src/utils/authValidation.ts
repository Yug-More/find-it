import type {
  SignInFieldErrors,
  SignInInput,
  SignUpFieldErrors,
  SignUpInput,
} from "../types/auth";

export const PASSWORD_MIN_LENGTH = 8;
const FULL_NAME_LIMIT = 80;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignIn(input: SignInInput): SignInFieldErrors {
  const errors: SignInFieldErrors = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function validateSignUp(input: SignUpInput): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim();

  if (!fullName) {
    errors.fullName = "Enter your full name.";
  } else if (fullName.length > FULL_NAME_LIMIT) {
    errors.fullName = `Full name must be ${FULL_NAME_LIMIT} characters or fewer.`;
  }

  if (!email) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Enter a password.";
  } else if (input.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function hasAuthErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
