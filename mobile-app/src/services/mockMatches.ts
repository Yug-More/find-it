import type { MatchResult } from "../types/match";
import { getMockReport, listMockReports } from "./mockReports";

const seeded: Record<string, { matchId: string; similarity: number }[]> = {
  "sample-lost-keys": [{ matchId: "sample-found-bottle", similarity: 0.81 }],
  "sample-found-bottle": [{ matchId: "sample-lost-keys", similarity: 0.81 }],
};

export function listMockMatchesForReport(reportId: string): MatchResult[] {
  const source = getMockReport(reportId);
  const pairs = seeded[reportId] ?? [];
  return pairs
    .map((pair) => {
      try {
        const report = getMockReport(pair.matchId);
        return {
          report,
          similarity: pair.similarity,
          sourceReportId: source.id,
          sourceTitle: source.title,
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is MatchResult => item !== null);
}

export function listMockMatchesForUser(userId: string): MatchResult[] {
  const owned = listMockReports().filter((report) => report.userId === userId);
  const results: MatchResult[] = [];
  for (const report of owned) {
    results.push(...listMockMatchesForReport(report.id));
  }
  return results.sort((left, right) => right.similarity - left.similarity);
}
