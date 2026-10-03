import { userEvent } from "@testing-library/react-native";

import { resetMockReports } from "../src/services/mockReports";
import { renderApp } from "./renderApp";

describe("HomeScreen", () => {
  beforeEach(() => {
    resetMockReports();
  });

  it("shows the product description and the three main actions", async () => {
    const view = await renderApp();

    expect(view.getByText("FindIt")).toBeOnTheScreen();
    expect(
      view.getByText(
        "Report lost and found items in one place and reconnect people with their belongings.",
      ),
    ).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Report a lost item" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Report a found item" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Browse reports" })).toBeOnTheScreen();
    expect(view.getByText("How FindIt works")).toBeOnTheScreen();
  });

  it("opens the lost-item form", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));

    expect(await view.findByLabelText("Item name")).toBeOnTheScreen();
    expect(view.getByRole("radio", { name: "Lost" })).toBeSelected();
  });

  it("opens the found-item form", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a found item" }));

    expect(await view.findByRole("radio", { name: "Found" })).toBeSelected();
  });
});
