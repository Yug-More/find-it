import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { userEvent } from "@testing-library/react-native";

import { AdminScreen } from "../src/screens/AdminScreen";
import {
  deleteAdminItem,
  listAdminClaims,
  listAdminItems,
  listAdminUsers,
  updateAdminItemStatus,
} from "../src/services/admin";
import { sampleReport } from "./fixtures";
import { pressButton } from "./pressButton";
import { renderApp } from "./renderApp";

jest.mock("../src/services/admin", () => ({
  fetchMyProfile: jest.fn(),
  listAdminUsers: jest.fn(),
  listAdminItems: jest.fn(),
  listAdminClaims: jest.fn(),
  updateAdminItemStatus: jest.fn(),
  deleteAdminItem: jest.fn(),
}));

const mockedUsers = listAdminUsers as jest.Mock;
const mockedItems = listAdminItems as jest.Mock;
const mockedClaims = listAdminClaims as jest.Mock;
const mockedUpdate = updateAdminItemStatus as jest.Mock;
const mockedDelete = deleteAdminItem as jest.Mock;

const Stack = createNativeStackNavigator<{ Admin: undefined }>();

function Harness() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Admin" component={AdminScreen} />
    </Stack.Navigator>
  );
}

beforeEach(() => {
  mockedUsers.mockResolvedValue([
    {
      id: "user-1",
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
  mockedItems.mockResolvedValue([
    sampleReport({ id: "report-1", title: "Open report", status: "open" }),
    sampleReport({ id: "report-2", title: "Resolved report", status: "resolved" }),
  ]);
  mockedClaims.mockResolvedValue([
    {
      id: "claim-1",
      itemId: "report-1",
      claimantId: "user-2",
      message: "It belongs to me.",
      status: "pending",
      createdAt: "2026-01-02T00:00:00.000Z",
    },
  ]);
  mockedUpdate.mockResolvedValue(
    sampleReport({ id: "report-1", title: "Open report", status: "resolved" }),
  );
  mockedDelete.mockResolvedValue(undefined);
});

it("lists reports and changes report status", async () => {
  const view = await renderApp(<Harness />);

  expect(await view.findByText("Reports (2)")).toBeOnTheScreen();
  await pressButton(view.getAllByRole("button", { name: "Mark resolved" })[0]);

  expect(mockedUpdate).toHaveBeenCalledWith("report-1", "resolved", "session-token");
  expect(await view.findAllByText("Reopen")).toHaveLength(2);
});

it("switches to users and claims sections", async () => {
  const view = await renderApp(<Harness />);
  await view.findByText("Reports (2)");

  await userEvent.press(view.getByRole("button", { name: "Users" }));
  expect(await view.findByText("Users (1)")).toBeOnTheScreen();
  expect(view.getByText("admin@example.com")).toBeOnTheScreen();

  await userEvent.press(view.getByRole("button", { name: "Claims" }));
  expect(await view.findByText("Claims (1)")).toBeOnTheScreen();
  expect(view.getByText("It belongs to me.")).toBeOnTheScreen();
});

it("deletes a report after confirmation", async () => {
  const view = await renderApp(<Harness />);
  await view.findByText("Reports (2)");

  await userEvent.press(view.getAllByRole("button", { name: "Delete report" })[0]);
  expect(await view.findByText("Delete this report?")).toBeOnTheScreen();
  const buttons = view.getAllByRole("button", { name: "Delete" });
  await pressButton(buttons[buttons.length - 1]);

  expect(mockedDelete).toHaveBeenCalledWith("report-1", "session-token");
  expect(await view.findByText("Reports (1)")).toBeOnTheScreen();
});
