import { getApiUrl } from "./config";
import { ReportServiceError } from "./errors";
import { isRecord } from "./mapReport";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  accessToken?: string;
  body?: Record<string, unknown>;
};

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
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
      safeDetail(detail, "You do not have permission for this request."),
      "forbidden",
    );
  }
  if (status === 404) {
    return new ReportServiceError(safeDetail(detail, "That resource could not be found."), "not_found");
  }
  if (status === 400 || status === 422) {
    return new ReportServiceError(safeDetail(detail, "The request was not accepted."), "validation");
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
