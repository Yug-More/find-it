import type { Report, ReportInput } from "../types/report";
import { getApiUrl, shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import { uploadReportImage } from "./imageStorage";
import {
  createMockReport,
  deleteMockReport,
  getMockReport,
  listMockReports,
  updateMockReport,
} from "./mockReports";
import { createItem, deleteItem, fetchItem, fetchItems, updateItem } from "./reportsApi";

const MISSING_URL =
  "The API URL is not configured. Set EXPO_PUBLIC_API_URL before turning off sample data.";

const MISSING_SESSION =
  "Sign-in is required to submit a report. The report was not sent to the server.";

const MISSING_ACCOUNT = "Sign-in is required before this report can be changed.";

export async function listReports(): Promise<Report[]> {
  if (shouldUseMockData()) {
    return listMockReports();
  }
  assertApiConfigured();
  return fetchItems();
}

export async function getReport(reportId: string): Promise<Report> {
  if (shouldUseMockData()) {
    return getMockReport(reportId);
  }
  assertApiConfigured();
  return fetchItem(reportId);
}

// Live submission sends the Supabase access token from the current session.
// The token is never read from environment variables.
export async function createReport(
  input: ReportInput,
  accessToken?: string,
  userId?: string,
): Promise<Report> {
  const prepared = await withUploadedImage(input, userId, shouldUseMockData());
  if (shouldUseMockData()) {
    return createMockReport(prepared, userId);
  }

  assertApiConfigured();
  if (!accessToken) {
    throw new ReportServiceError(MISSING_SESSION, "authentication");
  }

  return createItem(prepared, accessToken);
}

export async function updateReport(
  reportId: string,
  input: ReportInput,
  accessToken?: string,
  userId?: string,
): Promise<Report> {
  const prepared = await withUploadedImage(input, userId, shouldUseMockData());
  if (shouldUseMockData()) {
    if (!userId) {
      throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
    }
    return updateMockReport(reportId, prepared, userId);
  }

  assertApiConfigured();
  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  return updateItem(reportId, prepared, accessToken);
}

export async function deleteReport(
  reportId: string,
  accessToken?: string,
  userId?: string,
): Promise<void> {
  if (shouldUseMockData()) {
    if (!userId) {
      throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
    }
    deleteMockReport(reportId, userId);
    return;
  }

  assertApiConfigured();
  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  await deleteItem(reportId, accessToken);
}

async function withUploadedImage(
  input: ReportInput,
  userId: string | undefined,
  mockMode: boolean,
): Promise<ReportInput> {
  if (!input.image) {
    return input;
  }
  if (mockMode) {
    return { ...input, imageUrl: input.image.uri };
  }
  if (!userId) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  const imageUrl = await uploadReportImage(input.image, userId);
  return { ...input, image: null, imageUrl };
}

function assertApiConfigured(): void {
  if (!getApiUrl()) {
    throw new ReportServiceError(MISSING_URL, "configuration");
  }
}
