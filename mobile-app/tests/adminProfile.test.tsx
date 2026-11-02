import { userEvent } from "@testing-library/react-native";

import { renderApp } from "./renderApp";

const originalFetch = globalThis.fetch;

function profileResponse(role: "user" | "admin") {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
      role,
      created_at: "2026-01-01T00:00:00.000Z",
    }),
  };
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_USE_MOCK = "false";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

it("shows the admin entry for an admin profile", async () => {
  globalThis.fetch = jest.fn(async () => profileResponse("admin")) as unknown as typeof fetch;

  const view = await renderApp();
  await userEvent.press(view.getByRole("button", { name: "Profile" }));

  expect(await view.findByText("Admin controls")).toBeOnTheScreen();
});

it("hides the admin entry for a regular profile", async () => {
  globalThis.fetch = jest.fn(async () => profileResponse("user")) as unknown as typeof fetch;

  const view = await renderApp();
  await userEvent.press(view.getByRole("button", { name: "Profile" }));

  expect(await view.findByText("user@example.com")).toBeOnTheScreen();
  expect(view.queryByText("Admin controls")).toBeNull();
});
