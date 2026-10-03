import type { Report, ReportInput } from "../types/report";
import { getApiUrl, shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import { createMockReport, getMockReport, listMockReports } from "./mockReports";
import { createItem, fetchItem, fetchItems } from "./reportsApi";

const MISSING_URL =
  "The API URL is not configured. Set EXPO_PUBLIC_API_URL before turning off sample data.";

const MISSING_SESSION =
  "Sign-in is required to submit a report. This release does not include authentication, so the report was not sent to the server.";

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

// Live submission needs an access token from a future Supabase session.
// This release does not collect a session, and the token must not come from env config.
export async function createReport(input: ReportInput, accessToken?: string): Promise<Report> {
  if (shouldUseMockData()) {
    return createMockReport(input);
  }

  assertApiConfigured();
  if (!accessToken) {
    throw new ReportServiceError(MISSING_SESSION, "authentication");
  }

  return createItem(input, accessToken);
}

function assertApiConfigured(): void {
  if (!getApiUrl()) {
    throw new ReportServiceError(MISSING_URL, "configuration");
  }
}
