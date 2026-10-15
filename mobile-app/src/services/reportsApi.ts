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

export async function updateItem(
  reportId: string,
  input: ReportInput,
  accessToken: string,
): Promise<Report> {
  return mapItem(
    await request(`/items/${encodeURIComponent(reportId)}`, {
      method: "PATCH",
      accessToken,
      body: toItemCreate(input),
    }),
  );
}

export async function deleteItem(reportId: string, accessToken: string): Promise<void> {
  await request(`/items/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
    accessToken,
  });
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
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
    throw httpError(response.status, await readErrorDetail(response));
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    throw new ReportServiceError("The server returned an unreadable response.", "network");
  }
}

function httpError(status: number, detail: string | null): ReportServiceError {
  if (status === 401) {
    return new ReportServiceError(safeDetail(detail, "Sign-in is required for this request."), "authentication");
  }
  if (status === 403) {
    return new ReportServiceError(
      safeDetail(detail, "You do not have permission to change this report."),
      "forbidden",
    );
  }
  if (status === 404) {
    return new ReportServiceError(safeDetail(detail, "That report could not be found."), "not_found");
  }
  if (status === 400 || status === 422) {
    return new ReportServiceError(safeDetail(detail, "The report details were not accepted."), "validation");
  }
  if (status >= 500) {
    return new ReportServiceError(
      safeDetail(detail, "The server could not complete this request. Try again."),
      "network",
    );
  }
  return new ReportServiceError(safeDetail(detail, "The request could not be completed."), "network");
}

function safeDetail(detail: string | null, fallback: string): string {
  if (!detail) {
    return fallback;
  }
  if (/traceback|stack trace|sql|exception/i.test(detail)) {
    return fallback;
  }
  return detail;
}

async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body)) {
      return null;
    }
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => (isRecord(item) && typeof item.msg === "string" ? item.msg : ""))
        .filter((message) => message.length > 0);
      return messages.length > 0 ? messages.join(" ") : null;
    }
  } catch {
    return null;
  }
  return null;
}
