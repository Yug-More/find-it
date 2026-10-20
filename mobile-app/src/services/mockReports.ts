import type { Report, ReportInput } from "../types/report";
import { ReportServiceError } from "./errors";

const LOCAL_USER_ID = "local-user";

const sampleReports: Report[] = [
  {
    id: "sample-lost-keys",
    userId: "user-1",
    type: "lost",
    title: "Toyota key fob",
    description: "Silver key fob on a black lanyard. A house key is on the same ring.",
    category: "Keys",
    color: "Silver",
    brand: null,
    imageUrl: null,
    location: "West Parking Garage, Level 3",
    latitude: null,
    longitude: null,
    eventDate: "2026-01-22",
    status: "open",
    createdAt: "2026-01-22T18:00:00.000Z",
  },
  {
    id: "sample-found-bottle",
    userId: "other-user",
    type: "found",
    title: "Red water bottle",
    description: "Red wide-mouth bottle with a straw lid and a dent near the base.",
    category: "Bottles",
    color: "Red",
    brand: null,
    imageUrl: null,
    location: "Student Wellness Center",
    latitude: null,
    longitude: null,
    eventDate: "2026-01-25",
    status: "open",
    createdAt: "2026-01-25T20:00:00.000Z",
  },
];

let reports = clone(sampleReports);
let nextNumber = 1;

export function listMockReports(): Report[] {
  return clone(reports).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getMockReport(reportId: string): Report {
  const report = reports.find((item) => item.id === reportId);
  if (!report) {
    throw new ReportServiceError("That report could not be found.", "not_found");
  }
  return { ...report };
}

export function createMockReport(input: ReportInput, userId = LOCAL_USER_ID): Report {
  const createdAt = new Date().toISOString();
  const report: Report = {
    id: `local-${nextNumber}`,
    userId,
    type: input.type,
    title: input.title,
    description: input.description,
    category: input.category,
    color: input.color || null,
    brand: input.brand.trim() || null,
    imageUrl: input.image?.uri ?? input.imageUrl,
    location: input.location,
    latitude: null,
    longitude: null,
    eventDate: input.eventDate,
    status: "open",
    createdAt,
  };
  nextNumber += 1;
  reports = [report, ...reports];
  return { ...report };
}

export function updateMockReport(reportId: string, input: ReportInput, userId: string): Report {
  const current = reports.find((item) => item.id === reportId);
  if (!current) {
    throw new ReportServiceError("That report could not be found.", "not_found");
  }
  if (current.userId !== userId) {
    throw new ReportServiceError("You can only change reports you created.", "forbidden");
  }

  const updated: Report = {
    ...current,
    type: input.type,
    title: input.title,
    description: input.description,
    category: input.category,
    color: input.color || null,
    brand: input.brand.trim() || null,
    imageUrl: input.image?.uri ?? input.imageUrl,
    location: input.location,
    eventDate: input.eventDate,
  };
  reports = reports.map((item) => (item.id === reportId ? updated : item));
  return { ...updated };
}

export function updateMockReportStatus(reportId: string, status: Report["status"]): Report {
  const current = reports.find((item) => item.id === reportId);
  if (!current) {
    throw new ReportServiceError("That report could not be found.", "not_found");
  }
  const updated = { ...current, status };
  reports = reports.map((item) => (item.id === reportId ? updated : item));
  return { ...updated };
}

export function deleteMockReport(reportId: string, userId: string): void {
  const current = reports.find((item) => item.id === reportId);
  if (!current) {
    throw new ReportServiceError("That report could not be found.", "not_found");
  }
  if (current.userId !== userId) {
    throw new ReportServiceError("You can only delete reports you created.", "forbidden");
  }
  reports = reports.filter((item) => item.id !== reportId);
}

export function resetMockReports(): void {
  reports = clone(sampleReports);
  nextNumber = 1;
}

function clone(items: Report[]): Report[] {
  return items.map((item) => ({ ...item }));
}
