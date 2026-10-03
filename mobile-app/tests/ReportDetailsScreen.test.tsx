import { userEvent } from "@testing-library/react-native";

import { resetMockReports } from "../src/services/mockReports";
import { renderApp } from "./renderApp";

describe("ReportDetailsScreen", () => {
  beforeEach(() => {
    resetMockReports();
  });

  it("opens a report from the list and shows its details", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    await userEvent.press(await view.findByRole("button", { name: /Toyota key fob/ }));

    expect(
      await view.findByText("Silver key fob on a black lanyard. A house key is on the same ring."),
    ).toBeOnTheScreen();
    expect(view.getByText("West Parking Garage, Level 3")).toBeOnTheScreen();
    expect(view.getByText("Silver")).toBeOnTheScreen();
    expect(view.getByText("Keys")).toBeOnTheScreen();
    expect(view.getByText("Lost")).toBeOnTheScreen();
    expect(view.getAllByText("Open").length).toBeGreaterThan(0);
    expect(view.getByText("Date lost")).toBeOnTheScreen();
    expect(view.getByText("Submitted")).toBeOnTheScreen();
  });
});
