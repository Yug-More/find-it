import type { SelectedImage } from "../types/report";
import { ReportServiceError } from "./errors";
import { getSupabaseClient, getSupabaseConfigError, MISSING_SUPABASE_MESSAGE } from "./supabase";

export const REPORT_IMAGE_BUCKET = "report-images";

export async function uploadReportImage(image: SelectedImage, userId: string): Promise<string> {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new ReportServiceError(configError, "configuration");
  }

  if (!/^[A-Za-z0-9-]+$/.test(userId)) {
    throw new ReportServiceError(
      "The signed-in account could not be used for this upload.",
      "authentication",
    );
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new ReportServiceError(MISSING_SUPABASE_MESSAGE, "configuration");
  }

  const extension = extensionFor(image.mimeType);
  const path = `${userId}/${Date.now()}-${randomSuffix()}.${extension}`;
  const body = await readImage(image.uri);

  const { error } = await supabase.storage.from(REPORT_IMAGE_BUCKET).upload(path, body, {
    contentType: image.mimeType,
    upsert: false,
  });

  if (error) {
    throw new ReportServiceError(
      "The photo could not be uploaded. Check the storage bucket and try again.",
      "network",
    );
  }

  const { data } = supabase.storage.from(REPORT_IMAGE_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new ReportServiceError("The uploaded photo did not return a public URL.", "network");
  }
  return data.publicUrl;
}

async function readImage(uri: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error("unreadable");
    }
    return await response.arrayBuffer();
  } catch {
    throw new ReportServiceError("The selected photo could not be read.", "validation");
  }
}

function extensionFor(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
