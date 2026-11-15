import { listMockMatchesForReport, listMockMatchesForUser } from "../src/services/mockMatches";
import { createMockReport, resetMockReports, updateMockReportStatus } from "../src/services/mockReports";
import { sampleInput } from "./fixtures";

beforeEach(resetMockReports);
function candidate(user = "other-user", type: "lost" | "found" = "found") {
  return createMockReport(sampleInput({ type, title: "Toyota key fob found", category: "Keys" }), user);
}
it("does not pair unrelated sample reports", () => {
  expect(listMockMatchesForReport("sample-lost-keys")).toEqual([]);
});
it("excludes resolved source reports from every discovery path", () => {
  candidate();
  expect(listMockMatchesForUser("user-1")).toHaveLength(1);
  updateMockReportStatus("sample-lost-keys", "resolved");
  expect(listMockMatchesForUser("user-1")).toEqual([]);
  expect(listMockMatchesForReport("sample-lost-keys")).toEqual([]);
});
it("excludes resolved candidates, same owners and same types", () => {
  const found = candidate();
  updateMockReportStatus(found.id, "resolved");
  candidate("user-1");
  candidate("other-user", "lost");
  expect(listMockMatchesForReport("sample-lost-keys")).toEqual([]);
});
it("finds a repeatable opposite report in either direction", () => {
  const found = candidate();
  expect(listMockMatchesForReport("sample-lost-keys")[0]).toMatchObject({ report: { id: found.id }, similarity: 0.81 });
  expect(listMockMatchesForReport(found.id)[0].report.id).toBe("sample-lost-keys");
});
