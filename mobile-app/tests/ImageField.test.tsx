import { render, userEvent } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageField } from "../src/components/reports/ImageField";

it("preserves the existing photo after a picker failure and allows retry", async () => {
  const onChange = jest.fn();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockRejectedValueOnce(new Error("unavailable"));
  const view = await render(<ImageField image={null} imageUrl="https://example.com/photo.jpg" onChange={onChange} />);
  await userEvent.press(view.getByRole("button", { name: "Replace photo" }));
  expect(await view.findByText("The photo library could not be opened. Try again.")).toBeOnTheScreen();
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.press(view.getByRole("button", { name: "Replace photo" }));
  expect(view.queryByText("The photo library could not be opened. Try again.")).toBeNull();
  expect(view.getByRole("button", { name: "Replace photo" })).toBeEnabled();
});
