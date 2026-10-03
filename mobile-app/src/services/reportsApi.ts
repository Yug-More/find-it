import { getApiUrl } from "./config";
import { ReportServiceError } from "./errors";
import { isRecord, mapItem, mapItemList, toItemCreate } from "./mapReport";
import type { Report, ReportInput } from "../types/report";

export async function fetchItems(): Promise<Report[]> {
  return mapItemList(await request("/items"));
}

export async function fetchItem(reportId: string): Promise<Report> {
  return mapItem(await request(`/items/${encodeURIComponent(reportId)}`));
}

export async function createItem(input: ReportInput, accessToken: string): Promise<Report> {
  return mapItem(
    await request("/items", {
      method: "POST",
      accessToken,
      body: toItemCreate(input),
    }),
  );
}

type RequestOptions = {
  method?: "GET" | "POST";
  accessToken?: string;
  body?: Record<string, unknown>;
};

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ReportServiceError(
      "The FindIt service could not be reached. Check that the API is running and the API URL is correct.",
      "network",
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    if (response.status === 401 || response.status === 403) {
      throw new ReportServiceError(detail ?? "Sign-in is required for this request.", "authentication");
    }
    if (response.status === 404) {
      throw new ReportServiceError(detail ?? "That report could not be found.", "not_found");
    }
    throw new ReportServiceError(detail ?? "The request could not be completed.", "network");
  }

  try {
    return await response.json();
  } catch {
    throw new ReportServiceError("The server returned an unreadable response.", "network");
  }
}

async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    return null;
  }
  return null;
}
