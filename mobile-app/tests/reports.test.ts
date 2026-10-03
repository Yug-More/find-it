import { createReport, listReports } from "../src/services/reports";
import { getApiUrl, shouldUseMockData } from "../src/services/config";
import { ReportServiceError } from "../src/services/errors";
import { resetMockReports } from "../src/services/mockReports";
import { sampleInput, sampleItemResponse } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: jest.fn(() => "http://localhost:8000"),
  shouldUseMockData: jest.fn(() => true),
}));

const mockedUseMock = jest.mocked(shouldUseMockData);
const mockedApiUrl = jest.mocked(getApiUrl);

describe("reports service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetMockReports();
    mockedUseMock.mockReturnValue(true);
    mockedApiUrl.mockReturnValue("http://localhost:8000");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("submits in mock mode without a session token", async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
    const report = await createReport(sampleInput());
    expect(report.title).toBe("Blue notebook");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an authentication error for live submission without a session token", async () => {
    mockedUseMock.mockReturnValue(false);
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    await expect(createReport(sampleInput())).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({
        kind: "authentication",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a configuration error when live mode has no API URL", async () => {
    mockedUseMock.mockReturnValue(false);
    mockedApiUrl.mockReturnValue("");

    await expect(listReports()).rejects.toEqual(
      expect.objectContaining<Partial<ReportServiceError>>({
        kind: "configuration",
      }),
    );
  });

  it("sends a caller-provided session token to POST /items", async () => {
    mockedUseMock.mockReturnValue(false);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => sampleItemResponse({ title: "Blue notebook", type: "lost" }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await createReport(sampleInput(), "session-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/items",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }) as Record<string, string>,
      }),
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.title).toBe("Blue notebook");
    expect(body).not.toHaveProperty("accessToken");
  });

  it("loads GET /items without an authorization header", async () => {
    mockedUseMock.mockReturnValue(false);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [sampleItemResponse()],
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const reports = await listReports();
    expect(reports[0]?.title).toBe("Gray hoodie");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).not.toHaveProperty("Authorization");
  });
});
