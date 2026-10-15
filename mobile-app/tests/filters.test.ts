import { sampleReport } from "./fixtures";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  filterDateError,
  filterReports,
  reportsForUser,
} from "../src/utils/filters";

const reports = [
  sampleReport({
    id: "keys",
    title: "Toyota key fob",
    description: "Silver key fob",
    category: "Keys",
    color: "Silver",
    brand: "Toyota",
    location: "West Parking Garage",
    eventDate: "2026-01-22",
    type: "lost",
    status: "open",
    userId: "user-1",
  }),
  sampleReport({
    id: "bottle",
    title: "Red water bottle",
    description: "Wide-mouth bottle",
    category: "Bottles",
    color: "Red",
    brand: null,
    location: "Student Wellness Center",
    eventDate: "2026-02-02",
    type: "found",
    status: "resolved",
    userId: "other-user",
  }),
];

describe("report filters", () => {
  it("starts with no active filters", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("matches a keyword against title, description, category, color, brand, and location", () => {
    expect(filterReports(reports, { ...EMPTY_FILTERS, query: "toyota" }).map((item) => item.id)).toEqual([
      "keys",
    ]);
    expect(filterReports(reports, { ...EMPTY_FILTERS, query: "wellness" }).map((item) => item.id)).toEqual([
      "bottle",
    ]);
    expect(filterReports(reports, { ...EMPTY_FILTERS, query: "bottles" }).map((item) => item.id)).toEqual([
      "bottle",
    ]);
    expect(filterReports(reports, { ...EMPTY_FILTERS, query: "silver" }).map((item) => item.id)).toEqual([
      "keys",
    ]);
  });

  it("filters by type, category, status, and location", () => {
    expect(filterReports(reports, { ...EMPTY_FILTERS, type: "found" })).toHaveLength(1);
    expect(filterReports(reports, { ...EMPTY_FILTERS, category: "Keys" })).toHaveLength(1);
    expect(filterReports(reports, { ...EMPTY_FILTERS, status: "resolved" })[0]?.id).toBe("bottle");
    expect(filterReports(reports, { ...EMPTY_FILTERS, location: "parking" })).toHaveLength(1);
  });

  it("filters by an inclusive date range and reports an invalid range", () => {
    expect(filterReports(reports, { ...EMPTY_FILTERS, dateFrom: "2026-02-01" })).toHaveLength(1);
    expect(
      filterReports(reports, { ...EMPTY_FILTERS, dateFrom: "2026-01-01", dateTo: "2026-01-31" })[0]?.id,
    ).toBe("keys");
    expect(filterDateError({ ...EMPTY_FILTERS, dateFrom: "2026-02-02", dateTo: "2026-01-01" })).toBe(
      "The start date must be the same as or before the end date.",
    );
    expect(filterDateError({ ...EMPTY_FILTERS, dateFrom: "yesterday" })).toBe(
      "Enter the start date as YYYY-MM-DD.",
    );
  });

  it("counts active filters and can return no matches", () => {
    const filters = { ...EMPTY_FILTERS, query: "notebook", type: "lost" as const };
    expect(activeFilterCount(filters)).toBe(2);
    expect(filterReports(reports, filters)).toEqual([]);
  });

  it("keeps only reports owned by the signed-in user", () => {
    expect(reportsForUser(reports, "user-1").map((item) => item.id)).toEqual(["keys"]);
    expect(reportsForUser(reports, "missing")).toEqual([]);
  });
});
