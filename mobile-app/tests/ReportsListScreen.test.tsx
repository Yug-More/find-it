import { userEvent } from "@testing-library/react-native";

import { listReports } from "../src/services/reports";
import { sampleReport } from "./fixtures";
import { renderApp } from "./renderApp";

jest.mock("../src/services/reports", () => ({
  listReports: jest.fn(),
  getReport: jest.fn(),
  createReport: jest.fn(),
}));

const mockedListReports = jest.mocked(listReports);

describe("ReportsListScreen", () => {
  it("renders report cards", async () => {
    mockedListReports.mockResolvedValue([
      sampleReport({ id: "keys", title: "Toyota key fob", category: "Keys" }),
    ]);

    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));

    expect(await view.findByText("Toyota key fob")).toBeOnTheScreen();
    expect(view.getByText("Keys")).toBeOnTheScreen();
    expect(view.getByText("Lost")).toBeOnTheScreen();
  });

  it("shows an empty state", async () => {
    mockedListReports.mockResolvedValue([]);

    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));

    expect(await view.findByText("No reports yet")).toBeOnTheScreen();
    expect(
      view.getByText("Submitted lost and found reports will show up here."),
    ).toBeOnTheScreen();
  });

  it("shows an error state and retries", async () => {
    mockedListReports.mockRejectedValueOnce(new Error("Reports could not be loaded."));
    mockedListReports.mockResolvedValueOnce([sampleReport({ title: "Campus umbrella" })]);

    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));

    expect(await view.findByText("Reports could not be loaded.")).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Retry" }));
    expect(await view.findByText("Campus umbrella")).toBeOnTheScreen();
  });
});
