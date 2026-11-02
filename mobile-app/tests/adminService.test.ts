import {
  deleteAdminItem,
  fetchMyProfile,
  listAdminClaims,
  listAdminItems,
  listAdminUsers,
  updateAdminItemStatus,
} from "../src/services/admin";
import { sampleItemResponse } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: () => "http://localhost:8000",
  shouldUseMockData: () => false,
}));

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function lastCall(fetchMock: jest.Mock) {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
}

it("loads the signed-in profile and admin role", async () => {
  const fetchMock = jest.fn(async () =>
    response({
      id: "user-1",
      email: "admin@example.com",
      full_name: "Admin User",
      role: "admin",
      created_at: "2026-01-01T00:00:00.000Z",
    }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const profile = await fetchMyProfile("session-token");

  expect(profile).toEqual({
    id: "user-1",
    email: "admin@example.com",
    fullName: "Admin User",
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const [url, options] = lastCall(fetchMock);
  expect(url).toBe("http://localhost:8000/auth/me");
  expect(options.headers).toEqual(
    expect.objectContaining({ Authorization: "Bearer session-token" }),
  );
});

it("loads admin users", async () => {
  globalThis.fetch = jest.fn(async () =>
    response([
      {
        id: "user-1",
        email: "admin@example.com",
        full_name: null,
        role: "admin",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ]),
  ) as unknown as typeof fetch;

  const users = await listAdminUsers("session-token");

  expect(users).toHaveLength(1);
  expect(users[0].role).toBe("admin");
  expect(users[0].fullName).toBeNull();
});

it("loads all admin reports and filters by status", async () => {
  const fetchMock = jest.fn(async () =>
    response([sampleItemResponse({ status: "resolved", title: "Resolved item" })]),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const reports = await listAdminItems("session-token", "resolved");

  expect(reports[0].status).toBe("resolved");
  expect(lastCall(fetchMock)[0]).toBe("http://localhost:8000/admin/items?status=resolved");
});

it("updates report status and deletes reports", async () => {
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "DELETE") {
      return response(null, 204);
    }
    return response(sampleItemResponse({ status: "resolved" }));
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const updated = await updateAdminItemStatus("item-1", "resolved", "session-token");
  await deleteAdminItem("item-1", "session-token");

  expect(updated.status).toBe("resolved");
  const [patchUrl, patchOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(patchUrl).toBe("http://localhost:8000/admin/items/item-1");
  expect(patchOptions.method).toBe("PATCH");
  expect(patchOptions.body).toBe(JSON.stringify({ status: "resolved" }));
  const [deleteUrl, deleteOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
  expect(deleteUrl).toBe("http://localhost:8000/admin/items/item-1");
  expect(deleteOptions.method).toBe("DELETE");
});

it("loads admin claims", async () => {
  globalThis.fetch = jest.fn(async () =>
    response([
      {
        id: "claim-1",
        item_id: "item-1",
        claimant_id: "user-2",
        message: "It is mine",
        status: "pending",
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ]),
  ) as unknown as typeof fetch;

  const claims = await listAdminClaims("session-token", "pending");

  expect(claims).toHaveLength(1);
  expect(claims[0]).toMatchObject({
    id: "claim-1",
    itemId: "item-1",
    claimantId: "user-2",
    message: "It is mine",
    status: "pending",
    createdAt: "2026-01-02T00:00:00.000Z",
  });
});

it("maps a forbidden admin response to the forbidden error kind", async () => {
  globalThis.fetch = jest.fn(async () =>
    response({ detail: "Admin access is required for this request." }, 403),
  ) as unknown as typeof fetch;

  await expect(listAdminUsers("session-token")).rejects.toMatchObject({
    kind: "forbidden",
  });
});
