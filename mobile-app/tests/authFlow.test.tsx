import { fireEvent, userEvent, waitFor } from "@testing-library/react-native";

import { createReport } from "../src/services/reports";
import { MISSING_SUPABASE_MESSAGE } from "../src/services/supabase";
import {
  buildTestSession,
  holdSessionRestore,
  authSubscriptionStats,
  listenerCount,
  releaseSessionRestore,
  setMockSession,
  setSignInError,
  setSignUpNeedsConfirmation,
  signInCallCount,
  signUpCallCount,
} from "./supabaseMock";
import { pressButton } from "./pressButton";
import { renderApp } from "./renderApp";

jest.mock("../src/services/reports", () => {
  const actual = jest.requireActual<typeof import("../src/services/reports")>(
    "../src/services/reports",
  );
  return {
    ...actual,
    createReport: jest.fn(actual.createReport),
  };
});

const mockedCreateReport = jest.mocked(createReport);

async function pressLastButton(
  view: { getAllByRole: (role: "button", options: { name: string }) => { props: object }[] },
  name: string,
) {
  const matches = view.getAllByRole("button", { name });
  const target = matches[matches.length - 1];
  if (!target) {
    throw new Error(`No button named ${name}`);
  }
  await pressButton(target);
}

describe("authentication flow", () => {
  it("shows a loading state while the saved session is restored", async () => {
    holdSessionRestore();
    const view = await renderApp(undefined, { settleAuth: false });

    expect(view.getByText("Restoring your session")).toBeOnTheScreen();
    expect(view.queryByText("Report a lost item")).toBeNull();

    releaseSessionRestore();

    expect(await view.findByRole("button", { name: "Profile" })).toBeOnTheScreen();
  });

  it("removes the auth subscription when the app unmounts", async () => {
    const view = await renderApp();
    expect(listenerCount()).toBeGreaterThan(0);
    view.unmount();
    await waitFor(() => {
      expect(authSubscriptionStats().listeners).toBe(0);
    });
  });

  it("shows sign-in validation messages and does not call Supabase", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Sign in" }));
    await pressLastButton(view, "Sign in");

    expect(await view.findByText("Enter your email.")).toBeOnTheScreen();
    expect(view.getByText("Enter your password.")).toBeOnTheScreen();
    expect(signInCallCount()).toBe(0);
  });

  it("rejects an invalid email on the sign-in form", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Sign in" }));
    await fireEvent.changeText(view.getByLabelText("Email"), "not-an-email");
    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await pressLastButton(view, "Sign in");

    expect(await view.findByText("Enter a valid email address.")).toBeOnTheScreen();
    expect(signInCallCount()).toBe(0);
  });

  it("shows an authentication error and stays on sign-in", async () => {
    setMockSession(null);
    setSignInError("Invalid login credentials");
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Sign in" }));
    await fireEvent.changeText(view.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await pressLastButton(view, "Sign in");

    expect(await view.findByText("Invalid login credentials")).toBeOnTheScreen();
    expect(view.getByLabelText("Password")).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Profile" })).toBeNull();
  });

  it("opens Home after a successful sign-in", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Sign in" }));
    await fireEvent.changeText(view.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await pressLastButton(view, "Sign in");

    expect(await view.findByRole("button", { name: "Profile" })).toBeOnTheScreen();
  });

  it("sends a signed-out report action to sign-in and does not submit", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));

    expect(
      await view.findByText("An account is required to submit a report. Sign in to continue."),
    ).toBeOnTheScreen();
    expect(view.queryByLabelText("Item name")).toBeNull();
    expect(mockedCreateReport).not.toHaveBeenCalled();
  });

  it("returns to the report form after signing in from a found-item action", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a found item" }));
    await fireEvent.changeText(await view.findByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await pressLastButton(view, "Sign in");

    expect(await view.findByRole("radio", { name: "Found" })).toBeSelected();
  });

  it("shows sign-up validation for empty fields, a short password, and a mismatch", async () => {
    setMockSession(null);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Create account" }));
    await pressLastButton(view, "Create account");

    expect(view.getByText("Enter your full name.")).toBeOnTheScreen();
    expect(view.getByText("Enter your email.")).toBeOnTheScreen();
    expect(view.getByText("Enter a password.")).toBeOnTheScreen();
    expect(view.getByText("Confirm your password.")).toBeOnTheScreen();
    expect(signUpCallCount()).toBe(0);

    await fireEvent.changeText(view.getByLabelText("Full name"), "Test User");
    await fireEvent.changeText(view.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "short");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "short");
    await pressLastButton(view, "Create account");
    expect(view.getByRole("alert", { name: "Use at least 8 characters." })).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "password13");
    await pressLastButton(view, "Create account");
    expect(view.getByText("Passwords do not match.")).toBeOnTheScreen();
    expect(signUpCallCount()).toBe(0);
  });

  it("tells the user to check their email when confirmation is required", async () => {
    setMockSession(null);
    setSignUpNeedsConfirmation(true);
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Create account" }));
    await fireEvent.changeText(view.getByLabelText("Full name"), "Test User");
    await fireEvent.changeText(view.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "password12");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "password12");
    await pressLastButton(view, "Create account");

    expect(await view.findByText("Check your email")).toBeOnTheScreen();
    expect(view.getByText(/confirm it, then sign in/)).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Profile" })).toBeNull();
  });

  it("shows the profile and signs out without calling the session expired", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Profile" }));

    expect(await view.findByText("Test User")).toBeOnTheScreen();
    expect(view.getByText("user@example.com")).toBeOnTheScreen();

    await pressButton(view.getByRole("button", { name: "Sign out" }));

    expect(await view.findByRole("button", { name: "Create account" })).toBeOnTheScreen();
    expect(view.queryByText(/session has expired/i)).toBeNull();
  });

  it("explains a missing Supabase configuration and still opens reports", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const view = await renderApp();

    expect(await view.findByText(MISSING_SUPABASE_MESSAGE)).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    expect(await view.findByText("Toyota key fob")).toBeOnTheScreen();
  });

  it("passes the session access token to createReport", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));

    await fireEvent.changeText(await view.findByLabelText("Item name"), "Blue notebook");
    await userEvent.press(view.getByRole("radio", { name: "Other" }));
    await fireEvent.changeText(view.getByLabelText("Description"), "A blue notebook left in a study room.");
    await fireEvent.changeText(view.getByLabelText("Location"), "King Library");
    await fireEvent.changeText(view.getByLabelText("Date lost"), "2026-01-15");
    await pressButton(view.getByRole("button", { name: "Submit report" }));

    expect(mockedCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Blue notebook", type: "lost" }),
      "session-token",
    );
    expect(await view.findByText("Report submitted")).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "View this report" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Browse reports" })).toBeOnTheScreen();
  });

  it("does not submit a report when the access token is missing", async () => {
    setMockSession(buildTestSession({ accessToken: "" }));
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));

    expect(
      await view.findByText("Your session has expired. Sign in again to submit this report."),
    ).toBeOnTheScreen();
    expect(mockedCreateReport).not.toHaveBeenCalled();
  });
});
