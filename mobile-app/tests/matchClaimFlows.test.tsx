import { fireEvent, userEvent } from "@testing-library/react-native";

import { resetMockClaims } from "../src/services/mockClaims";
import { resetMockNotifications } from "../src/services/mockNotifications";
import { resetMockReports } from "../src/services/mockReports";
import { pressButton } from "./pressButton";
import { renderApp } from "./renderApp";

describe("Match, claim, and notification flows", () => {
  beforeEach(() => {
    resetMockReports();
    resetMockClaims();
    resetMockNotifications();
  });

  it("lists matches for the signed-in user's reports", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Matches" }));

    expect(await view.findByText("Red water bottle")).toBeOnTheScreen();
    expect(view.getByText("81% match")).toBeOnTheScreen();
    expect(view.getByText(/Related to Toyota key fob/)).toBeOnTheScreen();
  });

  it("lets a non-owner submit a claim and shows owner claims", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    await userEvent.press(
      await view.findByRole("button", {
        name: "Red water bottle, Found, Bottles, Student Wellness Center",
      }),
    );

    expect(await view.findByRole("button", { name: "Claim this item" })).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Claim this item" }));

    await fireEvent.changeText(
      view.getByLabelText("Ownership explanation"),
      "This is my red bottle with the dent near the base and the straw lid.",
    );
    await pressButton(view.getByRole("button", { name: "Submit claim" }));

    expect(
      await view.findByText("This is my red bottle with the dent near the base and the straw lid."),
    ).toBeOnTheScreen();
    expect(view.getByText("Red water bottle")).toBeOnTheScreen();
    expect(view.getAllByText("Pending").length).toBeGreaterThan(0);
  });

  it("lets the owner approve a pending claim", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Claims" }));

    expect(await view.findByText("Toyota key fob")).toBeOnTheScreen();
    expect(view.getByText("Pending")).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Approve" }));
    expect(await view.findByText("Approve this claim?")).toBeOnTheScreen();
    const approveButtons = view.getAllByRole("button", { name: "Approve" });
    await pressButton(approveButtons[approveButtons.length - 1]);

    expect(await view.findByText("Approved")).toBeOnTheScreen();
  });

  it("opens notifications and marks them read", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Notifications" }));

    expect(await view.findByText("Possible match found")).toBeOnTheScreen();
    expect(view.getByText("New ownership claim")).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Mark all as read" }));
    expect(view.queryByLabelText("Unread")).toBeNull();
  });
});
