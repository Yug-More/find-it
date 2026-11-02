import { act, userEvent } from "@testing-library/react-native";
import * as service from "../src/services/notifications";
import { resetMockNotifications } from "../src/services/mockNotifications";
import { resetMockReports } from "../src/services/mockReports";
import { renderApp } from "./renderApp";

beforeEach(() => { resetMockNotifications(); resetMockReports(); });
afterEach(() => jest.restoreAllMocks());

it("shows unread count and marks all only after a successful request", async () => {
  const mark = jest.spyOn(service,"markAllNotificationsRead").mockRejectedValueOnce(new Error("Read update failed."));
  const view = await renderApp();
  await userEvent.press(view.getByRole("button",{name:"Notifications"}));
  expect(await view.findByText("2 unread")).toBeOnTheScreen();
  await userEvent.press(view.getByRole("button",{name:"Mark all as read"}));
  expect(await view.findByText("Read update failed.")).toBeOnTheScreen();
  expect(view.getByText("2 unread")).toBeOnTheScreen();
  mark.mockRestore();
  await userEvent.press(view.getByRole("button",{name:"Mark all as read"}));
  expect(await view.findByText("0 unread")).toBeOnTheScreen();
  expect(view.queryByLabelText("Unread")).toBeNull();
});

it("retries loading failures and handles empty notification history", async () => {
  jest.spyOn(service,"listNotifications").mockRejectedValueOnce(new Error("Notifications unavailable."))
    .mockResolvedValueOnce([]);
  const view = await renderApp();
  await userEvent.press(view.getByRole("button",{name:"Notifications"}));
  expect(await view.findByText("Notifications unavailable.")).toBeOnTheScreen();
  await userEvent.press(view.getByRole("button",{name:"Retry"}));
  expect(await view.findByText("No notifications")).toBeOnTheScreen();
});

it("keeps a failed read unread, then retries and navigates to its report", async () => {
  const mark = jest.spyOn(service,"markNotificationRead").mockRejectedValueOnce(new Error("Could not mark read."));
  const view = await renderApp();
  await userEvent.press(view.getByRole("button",{name:"Notifications"}));
  const name = "Unread. Possible match found. A found report looks similar to your Toyota key fob.";
  await userEvent.press(await view.findByRole("button",{name}));
  expect(await view.findByText("Could not mark read.")).toBeOnTheScreen();
  expect(view.getByText("2 unread")).toBeOnTheScreen();
  mark.mockRestore();
  await userEvent.press(view.getByRole("button",{name}));
  expect(await view.findByRole("header",{name:"Toyota key fob"})).toBeOnTheScreen();
});

it("handles a deleted related report without crashing", async () => {
  const actual = service.listNotifications;
  jest.spyOn(service,"listNotifications").mockImplementation(async (...args) =>
    (await actual(...args)).map(note => ({...note,reportId:"deleted-report"})));
  const view = await renderApp();
  await userEvent.press(view.getByRole("button",{name:"Notifications"}));
  await userEvent.press(await view.findByRole("button",{name:/Unread. Possible match found/}));
  expect(await view.findByText("That report could not be found.")).toBeOnTheScreen();
  expect(view.getByRole("button",{name:"Retry"})).toBeOnTheScreen();
});


it("shows a loading state until notification history arrives", async () => {
  let resolve!: (notes: Awaited<ReturnType<typeof service.listNotifications>>) => void;
  const pending = new Promise<Awaited<ReturnType<typeof service.listNotifications>>>((done) => { resolve = done; });
  jest.spyOn(service,"listNotifications").mockReturnValueOnce(pending);
  const view = await renderApp();
  await userEvent.press(view.getByRole("button", {name:"Notifications"}));
  expect(view.getByText("Loading notifications")).toBeOnTheScreen();
  await act(async () => { resolve([]); });
  expect(await view.findByText("No notifications")).toBeOnTheScreen();
});
