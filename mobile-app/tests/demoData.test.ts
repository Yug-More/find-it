import { prepareDemoData } from "../src/services/demoData";
import { listMockReports } from "../src/services/mockReports";
import { listMockClaimsForUser } from "../src/services/mockClaims";
import { listMockMatchesForUser } from "../src/services/mockMatches";
import { listMockNotifications } from "../src/services/mockNotifications";

it("prepares repeatable demo history with a relevant match and every claim state", () => {
  prepareDemoData();
  const reports = listMockReports();
  expect(reports).toHaveLength(7);
  expect(new Set(reports.map(r => r.type))).toEqual(new Set(["lost", "found"]));
  expect(reports.some(r => r.status === "resolved")).toBe(true);
  expect(new Set(listMockClaimsForUser("user-1").map(c => c.status)))
    .toEqual(new Set(["pending", "approved", "rejected"]));
  expect(listMockMatchesForUser("user-1")[0].report.title).toBe("Toyota key fob found");
  const notes = listMockNotifications("user-1");
  expect(notes.some(n => n.read)).toBe(true);
  expect(notes.some(n => !n.read)).toBe(true);
  prepareDemoData();
  expect(listMockReports().map(r => r.id)).toEqual(reports.map(r => r.id));
});
