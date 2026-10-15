import { PermissionStatus } from "expo";
import * as ImagePicker from "expo-image-picker";
import { fireEvent, userEvent } from "@testing-library/react-native";

import * as reports from "../src/services/reports";
import { resetMockReports } from "../src/services/mockReports";
import { pressButton } from "./pressButton";
import { renderApp } from "./renderApp";

const launchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const requestLibrary = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);

describe("Sprint 2 report flows", () => {
  beforeEach(() => {
    resetMockReports();
    launchLibrary.mockResolvedValue({ canceled: true, assets: null });
    requestLibrary.mockResolvedValue({
      granted: true,
      status: PermissionStatus.GRANTED,
      expires: "never",
      canAskAgain: true,
    });
  });

  it("filters the report list and clears the filters", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    expect(await view.findByText("2 reports")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Search"), "bottle");
    expect(await view.findByText("1 report, 1 filter")).toBeOnTheScreen();
    expect(view.queryByText("Toyota key fob")).toBeNull();

    await userEvent.press(view.getByRole("button", { name: "Clear filters" }));
    expect(await view.findByText("Toyota key fob")).toBeOnTheScreen();
    expect(view.getByText("Red water bottle")).toBeOnTheScreen();

    await userEvent.press(view.getByRole("button", { name: "Bottles" }));
    expect(view.queryByText("Toyota key fob")).toBeNull();
    expect(view.getByText("Red water bottle")).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText("Search"), "not-a-real-item");
    expect(await view.findByText("No matching reports")).toBeOnTheScreen();
  });

  it("shows only the signed-in user's reports", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "My reports" }));

    expect(await view.findByText("Toyota key fob")).toBeOnTheScreen();
    expect(view.queryByText("Red water bottle")).toBeNull();
    expect(view.getByRole("button", { name: "Edit" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Delete" })).toBeOnTheScreen();
  });

  it("hides owner actions on someone else's report", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Browse reports" }));
    await userEvent.press(await view.findByRole("button", { name: /Red water bottle/ }));

    expect(
      await view.findByText("Red wide-mouth bottle with a straw lid and a dent near the base."),
    ).toBeOnTheScreen();
    expect(view.queryByRole("button", { name: "Edit report" })).toBeNull();
    expect(view.queryByRole("button", { name: "Delete report" })).toBeNull();
  });

  it("saves an edited report and keeps the form when saving fails", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "My reports" }));
    await userEvent.press(await view.findByRole("button", { name: "Edit" }));

    const name = await view.findByLabelText("Item name");
    await fireEvent.changeText(name, "Updated key fob");
    await pressButton(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByText("Updated key fob")).toBeOnTheScreen();

    const update = jest.spyOn(reports, "updateReport").mockRejectedValueOnce(new Error("The report could not be saved."));
    await userEvent.press(view.getByRole("button", { name: "Edit report" }));
    const nameAgain = await view.findByLabelText("Item name");
    await fireEvent.changeText(nameAgain, "Still the key fob");
    await pressButton(view.getByRole("button", { name: "Save changes" }));

    expect(await view.findByText("The report could not be saved.")).toBeOnTheScreen();
    expect(view.getByLabelText("Item name").props.value).toBe("Still the key fob");
    update.mockRestore();
  });

  it("cancels deletion and then deletes the report", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "My reports" }));
    await userEvent.press(await view.findByRole("button", { name: "Delete" }));

    expect(await view.findByText("Delete this report?")).toBeOnTheScreen();
    await userEvent.press(view.getByRole("button", { name: "Cancel" }));
    expect(view.getByText("Toyota key fob")).toBeOnTheScreen();

    await userEvent.press(view.getByRole("button", { name: "Delete" }));
    const deleteButtons = view.getAllByRole("button", { name: "Delete" });
    await pressButton(deleteButtons[deleteButtons.length - 1]);

    expect(await view.findByText("No reports yet")).toBeOnTheScreen();
    expect(view.queryByText("Toyota key fob")).toBeNull();
  });

  it("adds a selected photo and rejects a denied permission or bad file", async () => {
    const view = await renderApp();
    await userEvent.press(view.getByRole("button", { name: "Report a lost item" }));
    expect(await view.findByText("No photo")).toBeOnTheScreen();

    requestLibrary.mockResolvedValueOnce({
      granted: false,
      status: PermissionStatus.DENIED,
      expires: "never",
      canAskAgain: true,
    });
    await pressButton(view.getByRole("button", { name: "Add photo" }));
    expect(await view.findByText("Photo library access is required to add an image.")).toBeOnTheScreen();

    launchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file://notes.png",
          fileName: "notes.png",
          fileSize: 2048,
          mimeType: "image/png",
          width: 20,
          height: 20,
        },
      ],
    });
    await pressButton(view.getByRole("button", { name: "Add photo" }));
    expect(await view.findByRole("button", { name: "Replace photo" })).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Remove photo" })).toBeOnTheScreen();

    launchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file://notes.gif",
          fileName: "notes.gif",
          fileSize: 2048,
          mimeType: "image/gif",
          width: 20,
          height: 20,
        },
      ],
    });
    await pressButton(view.getByRole("button", { name: "Replace photo" }));
    expect(await view.findByText("Choose a JPEG, PNG, WebP, or HEIC image.")).toBeOnTheScreen();
  });
});
