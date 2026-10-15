import { createReport, deleteReport, updateReport } from "../src/services/reports";
import { shouldUseMockData } from "../src/services/config";
import { ReportServiceError } from "../src/services/errors";
import { resetMockReports } from "../src/services/mockReports";
import { sampleInput, sampleItemResponse } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: jest.fn(() => "http://localhost:8000"),
  shouldUseMockData: jest.fn(() => true),
}));

jest.mock("../src/services/imageStorage", () => ({
  uploadReportImage: jest.fn(async () => "https://cdn.example/photo.jpg"),
}));

const mockedUseMock = jest.mocked(shouldUseMockData);

describe("report management", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetMockReports();
    mockedUseMock.mockReturnValue(true);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("stores a mock image and lets the owner update and delete it", async () => {
    const created = await createReport(
      sampleInput({
        image: { uri: "file://notebook.jpg", mimeType: "image/jpeg", fileName: "notebook.jpg", fileSize: 10 },
      }),
      undefined,
      "user-1",
    );
    expect(created.imageUrl).toBe("file://notebook.jpg");
    expect(created.userId).toBe("user-1");

    const updated = await updateReport(
      created.id,
      sampleInput({ title: "Updated notebook" }),
      undefined,
      "user-1",
    );
    expect(updated.title).toBe("Updated notebook");

    await expect(deleteReport(created.id, undefined, "other-user")).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({ kind: "forbidden" }),
    );
    await deleteReport(created.id, undefined, "user-1");
    await expect(updateReport(created.id, sampleInput(), undefined, "user-1")).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({ kind: "not_found" }),
    );
  });

  it("sends the access token to PATCH and DELETE", async () => {
    mockedUseMock.mockReturnValue(false);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sampleItemResponse({ title: "Updated notebook" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("no body");
        },
      });
    globalThis.fetch = fetchMock as typeof fetch;

    await updateReport("item-1", sampleInput({ title: "Updated notebook" }), "session-token", "user-1");
    await deleteReport("item-1", "session-token", "user-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/items/item-1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/items/item-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("maps 403 and 422 responses without calling them success", async () => {
    mockedUseMock.mockReturnValue(false);
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: "You can only change reports you created." }),
    }) as typeof fetch;

    await expect(updateReport("item-1", sampleInput(), "session-token", "user-1")).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({ kind: "forbidden" }),
    );

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: [{ msg: "Field required" }] }),
    }) as typeof fetch;

    await expect(updateReport("item-1", sampleInput(), "session-token", "user-1")).rejects.toEqual(
      expect.objectContaining({
        kind: "validation",
        message: "Field required",
      }),
    );
  });
});
