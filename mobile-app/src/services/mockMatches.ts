import type { MatchResult } from "../types/match";
import { getMockReport, listMockReports } from "./mockReports";

// A repeatable demo estimate, independent of live embeddings. Require a shared
// category and descriptive title word so unrelated sample items are not paired.
export function listMockMatchesForReport(reportId: string): MatchResult[] {
  const source = getMockReport(reportId);
  if (source.status !== "open") return [];
  const words = new Set(source.title.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  return listMockReports()
    .filter((report) => report.status === "open" && report.id !== source.id &&
      report.userId !== source.userId && report.type !== source.type &&
      Boolean(source.category) && report.category === source.category &&
      (report.title.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).some((word) => words.has(word)))
    .map((report) => ({ report, similarity: 0.81, sourceReportId: source.id, sourceTitle: source.title }));
}

export function listMockMatchesForUser(userId: string): MatchResult[] {
  return listMockReports()
    .filter((report) => report.userId === userId && report.status === "open")
    .flatMap((report) => listMockMatchesForReport(report.id))
    .sort((left, right) => right.similarity - left.similarity);
}
