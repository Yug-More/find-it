import type { SelectedImage } from "../types/report";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export function mimeTypeForFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? "";
}

export function validateSelectedImage(image: Pick<SelectedImage, "mimeType" | "fileSize">): string | null {
  const mimeType = image.mimeType.toLowerCase();
  if (!ALLOWED_TYPES.has(mimeType)) {
    return "Choose a JPEG, PNG, WebP, or HEIC image.";
  }
  if (image.fileSize != null && image.fileSize > MAX_IMAGE_BYTES) {
    return "Choose an image that is 5 MB or smaller.";
  }
  return null;
}
