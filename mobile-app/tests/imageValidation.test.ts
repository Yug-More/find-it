import { validateSelectedImage } from "../src/utils/imageValidation";

describe("image validation", () => {
  it("accepts a jpeg under the size limit", () => {
    expect(validateSelectedImage({ mimeType: "image/jpeg", fileSize: 1024 })).toBeNull();
  });

  it("rejects an unsupported file type", () => {
    expect(validateSelectedImage({ mimeType: "image/gif", fileSize: 1024 })).toBe(
      "Choose a JPEG, PNG, WebP, or HEIC image.",
    );
  });

  it("rejects an image larger than 5 MB", () => {
    expect(validateSelectedImage({ mimeType: "image/png", fileSize: 5 * 1024 * 1024 + 1 })).toBe(
      "Choose an image that is 5 MB or smaller.",
    );
  });

  it("allows a missing file size", () => {
    expect(validateSelectedImage({ mimeType: "image/webp", fileSize: null })).toBeNull();
  });
});
