import { userEvent } from "@testing-library/react-native";

import { shouldUseMockData } from "../src/services/config";
import { resetMockReports } from "../src/services/mockReports";
import { setMockSession } from "./supabaseMock";
import { renderApp } from "./renderApp";

describe("mock demo session", () => {
  beforeEach(() => {
    resetMockReports();
    setMockSession(null);
  });

  it("offers a demo account only while mock mode is enabled", async () => {
    expect(shouldUseMockData()).toBe(true);
    const view = await renderApp();

    expect(view.getByRole("button", { name: "Continue with demo account" })).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Continue with demo account" }));

    expect(await view.findByRole("button", { name: "Profile" })).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Profile" }));
    expect(await view.findByText("Demo account")).toBeOnTheScreen();
    expect(view.getByText("Demo Finder")).toBeOnTheScreen();
  });
});
