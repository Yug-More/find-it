import { cleanup, fireEvent, userEvent } from "@testing-library/react-native";

import { ReportForm } from "../src/components/reports/ReportForm";
import { resetMockReports } from "../src/services/mockReports";
import { renderApp } from "./renderApp";

// Inside a native stack screen, Pressable receives the accessibility click on `onClick`.
function pressButton(instance: { props: { onClick?: (event: object) => void } }) {
  instance.props.onClick?.({
    nativeEvent: {},
    currentTarget: instance,
    target: instance,
  });
}

describe("ReportForm", () => {
  beforeEach(async () => {
    jest.useRealTimers();
    resetMockReports();
    await cleanup();
  });

  it("disables submission while a request is processing", async () => {
    const view = await renderApp(<ReportForm initialType="found" submitting onSubmit={jest.fn()} />);

    expect(view.getByRole("button", { name: "Submitting" })).toBeDisabled();
  });

  it("shows required-field messages and does not submit an empty form", async () => {
    const onSubmit = jest.fn();
    const view = await renderApp(
      <ReportForm initialType="lost" submitting={false} onSubmit={onSubmit} />,
    );

    await userEvent.press(view.getByRole("button", { name: "Submit report" }));

    expect(view.getByText("Enter the item name.")).toBeOnTheScreen();
    expect(view.getByText("Select a category.")).toBeOnTheScreen();
    expect(view.getByText("Enter a description.")).toBeOnTheScreen();
    expect(view.getByText("Enter where the item was lost or found.")).toBeOnTheScreen();
    expect(view.getByText("Enter the date as YYYY-MM-DD.")).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid report and confirms it on the success screen", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));

    fireEvent.changeText(await view.findByLabelText("Item name"), "Blue notebook");
    await userEvent.press(view.getByRole("radio", { name: "Other" }));
    fireEvent.changeText(
      view.getByLabelText("Description"),
      "A blue notebook left in a study room.",
    );
    fireEvent.changeText(view.getByLabelText("Location"), "King Library");
    fireEvent.changeText(view.getByLabelText("Date lost"), "2026-01-15");
    pressButton(view.getByRole("button", { name: "Submit report" }));

    expect(await view.findByText("Report submitted")).toBeOnTheScreen();
    expect(view.getByText("Blue notebook was added to the reports list.")).toBeOnTheScreen();
    expect(
      view.getByText("This copy stays on this device. It was not sent to the server."),
    ).toBeOnTheScreen();
  });
});
