import { createReport, updateReport } from "../src/services/reports";
import { getApiUrl } from "../src/services/config";
import { uploadReportImage } from "../src/services/imageStorage";
import { sampleInput } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: jest.fn(() => "http://localhost:8000"),
  shouldUseMockData: () => false,
}));
jest.mock("../src/services/imageStorage", () => ({ uploadReportImage: jest.fn() }));

const input = sampleInput({ image: {
  uri: "file://photo.jpg", mimeType: "image/jpeg", fileName: "photo.jpg", fileSize: 10,
} });
beforeEach(() => {
  jest.mocked(getApiUrl).mockReturnValue("http://localhost:8000");
  jest.mocked(uploadReportImage).mockClear();
});

it.each(["create", "update"])("checks authentication before %s uploads a photo", async (action) => {
  const promise = action === "create"
    ? createReport(input, undefined, "user-1")
    : updateReport("item-1", input, undefined, "user-1");
  await expect(promise).rejects.toMatchObject({ kind: "authentication" });
  expect(uploadReportImage).not.toHaveBeenCalled();
});

it.each(["create", "update"])("checks API configuration before %s uploads a photo", async (action) => {
  jest.mocked(getApiUrl).mockReturnValue("");
  const promise = action === "create"
    ? createReport(input, "token", "user-1")
    : updateReport("item-1", input, "token", "user-1");
  await expect(promise).rejects.toMatchObject({ kind: "configuration" });
  expect(uploadReportImage).not.toHaveBeenCalled();
});
