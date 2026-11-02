import { listClaimsForUser } from "../src/services/claims";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../src/services/notifications";
import { mapNotification } from "../src/services/mapNotification";
import { sampleItemResponse } from "./fixtures";

jest.mock("../src/services/config", () => ({
  getApiUrl: () => "http://localhost:8000", shouldUseMockData: () => false,
}));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const note = {
  id: "note-1", user_id: "user-1", kind: "claim_update", title: "Claim approved",
  body: "Your claim was approved.", created_at: "2026-11-01T00:00:00Z", is_read: false,
  item_id: "item-1", claim_id: "claim-1",
};
const response = (data: unknown, status = 200) => ({ok:true, status, json: async () => data});

it("loads claimant-wide history, maps report details, and merges owner claims without duplicates", async () => {
  const claim = { id:"claim-1", item_id:"item-1", claimant_id:"user-1", message:"My hoodie", status:"approved",
    created_at:"2026-01-01", updated_at:"2026-02-01", item:sampleItemResponse({user_id:"other", status:"resolved"}) };
  const fetchMock = jest.fn(async (url: string) => response(url.endsWith("/claims/mine") ? [claim] : []));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const claims = await listClaimsForUser("token", "user-1");
  expect(claims).toHaveLength(1);
  expect(claims[0]).toMatchObject({ id:"claim-1", updatedAt:"2026-02-01", itemTitle:"Gray hoodie",
    item:{ status:"resolved", userId:"other", type:"found" } });
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/claims/mine",
    expect.objectContaining({headers:expect.objectContaining({Authorization:"Bearer token"})}));
});

it("maps live notifications and sends bearer tokens on list and read requests", async () => {
  const fetchMock = jest.fn().mockResolvedValueOnce(response([note]))
    .mockResolvedValueOnce(response({...note, is_read:true})).mockResolvedValueOnce(response(null,204));
  globalThis.fetch = fetchMock as typeof fetch;
  expect(await listNotifications("user-1", "token")).toEqual([expect.objectContaining({read:false, reportId:"item-1", claimId:"claim-1"})]);
  expect(await markNotificationRead("note-1", "user-1", "token")).toMatchObject({read:true});
  await markAllNotificationsRead("user-1", "token");
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "http://localhost:8000/notifications", "http://localhost:8000/notifications/note-1/read", "http://localhost:8000/notifications/read-all",
  ]);
  for (const [,init] of fetchMock.mock.calls) expect(init.headers.Authorization).toBe("Bearer token");
  expect(fetchMock.mock.calls[1][1].method).toBe("PATCH");
  expect(fetchMock.mock.calls[2][1].method).toBe("POST");
});

it("rejects notification calls without a token and malformed server responses", async () => {
  globalThis.fetch = jest.fn();
  await expect(listNotifications("user-1")).rejects.toMatchObject({kind:"authentication"});
  await expect(markNotificationRead("id","user-1")).rejects.toMatchObject({kind:"authentication"});
  await expect(markAllNotificationsRead("user-1")).rejects.toMatchObject({kind:"authentication"});
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(() => mapNotification({...note,is_read:"false"})).toThrow("unreadable");
  expect(() => mapNotification({...note,kind:"unknown"})).toThrow("unreadable");
});

it("preserves authorization errors and notification mutation failures", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ok:false,status:403,json:async () => ({detail:"Not yours"})}) as typeof fetch;
  await expect(markNotificationRead("other","user-1","token")).rejects.toMatchObject({kind:"forbidden"});
  globalThis.fetch = jest.fn().mockRejectedValue(new Error("Offline")) as typeof fetch;
  await expect(markAllNotificationsRead("user-1","token")).rejects.toMatchObject({kind:"network"});
});
