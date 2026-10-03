import type { Report, ReportInput } from "../src/types/report";

export function sampleInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    type: "lost",
    title: "Blue notebook",
    category: "Other",
    description: "A blue notebook left in a study room.",
    color: "Blue",
    location: "King Library",
    eventDate: "2026-01-15",
    ...overrides,
  };
}

export function sampleReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    userId: "user-1",
    type: "lost",
    title: "Blue notebook",
    description: "A blue notebook left in a study room.",
    category: "Other",
    color: "Blue",
    brand: null,
    imageUrl: null,
    location: "King Library",
    latitude: null,
    longitude: null,
    eventDate: "2026-01-15",
    status: "open",
    createdAt: "2026-01-15T18:00:00.000Z",
    ...overrides,
  };
}

export function sampleItemResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    user_id: "user-1",
    type: "found",
    title: "Gray hoodie",
    description: "A gray hoodie left on a chair.",
    category: "Clothing",
    color: "Gray",
    brand: "Champion",
    image_url: null,
    location: "Student Union",
    latitude: null,
    longitude: null,
    event_date: "2026-02-04T00:00:00Z",
    status: "open",
    created_at: "2026-02-04T20:00:00.000Z",
    ...overrides,
  };
}
