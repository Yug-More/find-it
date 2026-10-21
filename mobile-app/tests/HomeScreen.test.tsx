import { userEvent } from "@testing-library/react-native";

import { resetMockReports } from "../src/services/mockReports";
import { renderApp } from "./renderApp";

describe("HomeScreen", () => {
  beforeEach(() => {
    resetMockReports();
  });

  it("shows the product description and the main actions", async () => {
    const view = await renderApp();

    expect(view.getByText("FindIt")).toBeOnTheScreen();
    expect(
      view.getByText(
        "Report an item, browse campus reports, and follow up on matches or claims.",
      ),
    ).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Report a lost item" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Report a found item" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Browse reports" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Matches" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Claims" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Profile" })).toBeOnTheScreen();
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
