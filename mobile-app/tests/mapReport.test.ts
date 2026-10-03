import { mapItem, mapItemList, toItemCreate } from "../src/services/mapReport";
import { ReportServiceError } from "../src/services/errors";
import { sampleInput, sampleItemResponse } from "./fixtures";

describe("mapReport", () => {
  it("maps a backend item into a report", () => {
    expect(mapItem(sampleItemResponse())).toEqual({
      id: "item-1",
      userId: "user-1",
      type: "found",
      title: "Gray hoodie",
      description: "A gray hoodie left on a chair.",
      category: "Clothing",
      color: "Gray",
      brand: "Champion",
      imageUrl: null,
      location: "Student Union",
      latitude: null,
      longitude: null,
      eventDate: "2026-02-04T00:00:00Z",
      status: "open",
      createdAt: "2026-02-04T20:00:00.000Z",
    });
  });

  it("maps a list of items", () => {
    expect(mapItemList([sampleItemResponse()])).toHaveLength(1);
  });

  it("rejects an unreadable payload", () => {
    expect(() => mapItem({ title: "Missing the rest" })).toThrow(ReportServiceError);
    expect(() => mapItemList({ items: [] })).toThrow(ReportServiceError);
  });

  it("converts a report form into the item create body", () => {
    expect(toItemCreate(sampleInput({ color: "" }))).toEqual({
      type: "lost",
      title: "Blue notebook",
      description: "A blue notebook left in a study room.",
      category: "Other",
      color: null,
      location: "King Library",
      event_date: "2026-01-15T00:00:00.000Z",
    });
  });
});
