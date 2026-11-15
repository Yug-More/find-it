import { userEvent } from "@testing-library/react-native";

import * as service from "../src/services/matches";
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

it("offers a retry when related matches fail rather than showing a false empty result", async () => {
  const load = jest.spyOn(service, "listMatchesForReport")
    .mockRejectedValueOnce(new Error("Matching is temporarily unavailable."));
  try {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    await userEvent.press(await view.findByRole("button", { name: /Toyota key fob/ }));
    expect(await view.findByText("Matching is temporarily unavailable.")).toBeOnTheScreen();
    expect(view.queryByText("No similar reports are available for this item yet.")).toBeNull();
    await userEvent.press(view.getByRole("button", { name: "Retry" }));
    expect(await view.findByText("No similar reports are available for this item yet.")).toBeOnTheScreen();
    expect(view.queryByText("Matching is temporarily unavailable.")).toBeNull();
  } finally { load.mockRestore(); }
});
