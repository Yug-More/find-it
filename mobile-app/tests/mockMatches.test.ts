import { listMockMatchesForReport, listMockMatchesForUser } from "../src/services/mockMatches";
import { resetMockReports, updateMockReportStatus } from "../src/services/mockReports";

beforeEach(resetMockReports);

it("does not discover matches for a user's resolved reports", () => {
  expect(listMockMatchesForUser("user-1")).toHaveLength(1);
  updateMockReportStatus("sample-lost-keys", "resolved");
  expect(listMockMatchesForUser("user-1")).toEqual([]);
});

it("does not suggest resolved candidates", () => {
  updateMockReportStatus("sample-found-bottle", "resolved");
  expect(listMockMatchesForReport("sample-lost-keys")).toEqual([]);
});
