import { ReportServiceError } from "../src/services/errors";
import {
  createMockReport,
  getMockReport,
  listMockReports,
  resetMockReports,
} from "../src/services/mockReports";
import { sampleInput } from "./fixtures";

describe("mockReports", () => {
  beforeEach(() => {
    resetMockReports();
  });

  it("lists sample reports with the newest first", () => {
    const reports = listMockReports();
    expect(reports.map((report) => report.title)).toEqual(["Red water bottle", "Toyota key fob"]);
  });

  it("creates a report that can be read back", () => {
    const created = createMockReport(sampleInput());
    expect(created.status).toBe("open");
    expect(created.userId).toBe("local-user");
    expect(getMockReport(created.id)).toMatchObject({ title: "Blue notebook" });
    expect(listMockReports()[0]?.id).toBe(created.id);
  });

  it("stores a blank color as null", () => {
    const created = createMockReport(sampleInput({ color: "" }));
    expect(created.color).toBeNull();
  });

  it("reports a missing id", () => {
    expect(() => getMockReport("missing")).toThrow(ReportServiceError);
  });
});
