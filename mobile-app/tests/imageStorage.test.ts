import { uploadReportImage } from "../src/services/imageStorage";
import { ReportServiceError } from "../src/services/errors";
import { getLastUploadPath, setUploadError, uploadCallCount } from "./supabaseMock";

const photo = {
  uri: "file://photo.jpg",
  mimeType: "image/jpeg",
  fileName: "photo.jpg",
  fileSize: 1200,
};

describe("image upload", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uploads into the signed-in user's folder and returns a public URL", async () => {
    const url = await uploadReportImage(photo, "user-1");

    expect(uploadCallCount()).toBe(1);
    expect(getLastUploadPath()).toMatch(/^user-1\/\d+-[a-z0-9]+\.jpg$/);
    expect(url).toContain("/report-images/user-1/");
  });

  it("reports a storage failure without uploading the report", async () => {
    setUploadError("bucket missing");

    await expect(uploadReportImage(photo, "user-1")).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({ kind: "network" }),
    );
  });

  it("rejects an account id that cannot be used as a storage path", async () => {
    await expect(uploadReportImage(photo, "../other")).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({ kind: "authentication" }),
    );
    expect(uploadCallCount()).toBe(0);
  });
});

it("rejects unsupported metadata before reading or uploading", async () => {
  const read = jest.spyOn(globalThis, "fetch");
  await expect(uploadReportImage({ ...photo, mimeType: "text/html" }, "user-1"))
    .rejects.toMatchObject({ kind: "validation" });
  expect(read).not.toHaveBeenCalled();
  expect(uploadCallCount()).toBe(0);
  read.mockRestore();
});

it("checks actual bytes when picker size is unknown", async () => {
  const read = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true, arrayBuffer: async () => new ArrayBuffer(5 * 1024 * 1024 + 1),
  } as Response);
  try {
    await expect(uploadReportImage({ ...photo, fileSize: null }, "user-1"))
      .rejects.toMatchObject({ kind: "validation" });
    expect(uploadCallCount()).toBe(0);
  } finally { read.mockRestore(); }
});
