import { listReports } from "../src/services/reports";
import { listClaimsForUser } from "../src/services/claims";
import { listMatchesForUser } from "../src/services/matches";
import { sampleItemResponse } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: () => "http://localhost:8000",
  shouldUseMockData: () => false,
}));

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function response(data: unknown) {
  return { ok: true, status: 200, json: async () => data };
}

it("combines status requests, deduplicates a report resolved between reads, and sorts newest first", async () => {
  const open = sampleItemResponse({ id: "open", created_at: "2026-01-01" });
  const resolved = sampleItemResponse({ id: "resolved", status: "resolved", created_at: "2026-02-01" });
  const fetchMock = jest.fn(async (url: string) => response(
    url.endsWith("status=open") ? [open, { ...resolved, status: "open" }] : [resolved],
  ));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  expect((await listReports()).map(({ id, status }) => ({ id, status }))).toEqual([
    { id: "resolved", status: "resolved" }, { id: "open", status: "open" },
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("does not present partial history when the resolved request fails", async () => {
  globalThis.fetch = jest.fn(async (url: string) => url.endsWith("status=open")
    ? response([sampleItemResponse()])
    : { ok: false, status: 503, json: async () => ({}) }) as unknown as typeof fetch;
  await expect(listReports()).rejects.toMatchObject({ kind: "network" });
});

it("keeps claims on owned resolved reports and sends the token only to claim endpoints", async () => {
  const fetchMock = jest.fn(async (url: string) => {
    if (url.endsWith("status=open")) return response([]);
    if (url.endsWith("status=resolved")) return response([
      sampleItemResponse({ id: "resolved", status: "resolved" }),
      sampleItemResponse({ id: "other", user_id: "other-user", status: "resolved" }),
    ]);
    return response([{
      id: "claim-1", item_id: "resolved", claimant_id: "claimant", message: "My hoodie",
      status: "approved", created_at: "2026-02-04T20:00:00Z",
    }]);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  expect(await listClaimsForUser("session-token", "user-1")).toEqual([
    expect.objectContaining({ id: "claim-1", status: "approved", itemTitle: "Gray hoodie" }),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/items/resolved/claims",
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer session-token" }) }));
});

it("keeps match discovery limited to the default open-report endpoint", async () => {
  const fetchMock = jest.fn(async () => response([]));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await expect(listMatchesForUser("user-1")).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/items", expect.anything());
});
