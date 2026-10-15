import type { Report, ReportFilters } from "../types/report";
import { isCalendarDate } from "./dates";

export const EMPTY_FILTERS: ReportFilters = {
  query: "",
  type: "all",
  category: "all",
  location: "",
  dateFrom: "",
  dateTo: "",
  status: "all",
};

export function activeFilterCount(filters: ReportFilters): number {
  let count = 0;
  if (filters.query.trim()) {
    count += 1;
  }
  if (filters.type !== "all") {
    count += 1;
  }
  if (filters.category !== "all") {
    count += 1;
  }
  if (filters.location.trim()) {
    count += 1;
  }
  if (filters.dateFrom.trim()) {
    count += 1;
  }
  if (filters.dateTo.trim()) {
    count += 1;
  }
  if (filters.status !== "all") {
    count += 1;
  }
  return count;
}

export function filterDateError(filters: ReportFilters): string | null {
  const from = filters.dateFrom.trim();
  const to = filters.dateTo.trim();
  if (from && !isCalendarDate(from)) {
    return "Enter the start date as YYYY-MM-DD.";
  }
  if (to && !isCalendarDate(to)) {
    return "Enter the end date as YYYY-MM-DD.";
  }
  if (from && to && from > to) {
    return "The start date must be the same as or before the end date.";
  }
  return null;
}

export function filterReports(reports: Report[], filters: ReportFilters): Report[] {
  const query = filters.query.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const from = isCalendarDate(filters.dateFrom.trim()) ? filters.dateFrom.trim() : "";
  const to = isCalendarDate(filters.dateTo.trim()) ? filters.dateTo.trim() : "";
  const rangeReady = !filterDateError(filters);

  return reports.filter((report) => {
    if (filters.type !== "all" && report.type !== filters.type) {
      return false;
    }
    if (filters.category !== "all" && report.category !== filters.category) {
      return false;
    }
    if (filters.status !== "all" && report.status !== filters.status) {
      return false;
    }
    if (location && !(report.location ?? "").toLowerCase().includes(location)) {
      return false;
    }
    if (query && !searchText(report).includes(query)) {
      return false;
    }
    if (rangeReady && (from || to)) {
      const eventDate = report.eventDate?.slice(0, 10) ?? "";
      if (!eventDate) {
        return false;
      }
      if (from && eventDate < from) {
        return false;
      }
      if (to && eventDate > to) {
        return false;
      }
    }
    return true;
  });
}

export function reportsForUser(reports: Report[], userId: string): Report[] {
  return reports.filter((report) => report.userId === userId);
}

function searchText(report: Report): string {
  return [report.title, report.description, report.category, report.color, report.brand, report.location]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}
