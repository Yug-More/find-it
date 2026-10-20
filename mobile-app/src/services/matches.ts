import type { MatchResult } from "../types/match";
import { shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import { listMockMatchesForReport, listMockMatchesForUser } from "./mockMatches";
import { fetchItemMatches, fetchItems } from "./reportsApi";

export async function listMatchesForReport(reportId: string): Promise<MatchResult[]> {
  if (shouldUseMockData()) {
    return listMockMatchesForReport(reportId);
  }

  const matches = await fetchItemMatches(reportId);
  return matches.map((match) => ({
    report: match.report,
    similarity: match.similarity,
    sourceReportId: reportId,
    sourceTitle: "",
  }));
}

export async function listMatchesForUser(userId: string): Promise<MatchResult[]> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to view matches.", "authentication");
  }

  if (shouldUseMockData()) {
    return listMockMatchesForUser(userId);
  }

  const items = await fetchItems();
  const owned = items.filter((item) => item.userId === userId);
  const results: MatchResult[] = [];

  for (const source of owned) {
    try {
      const matches = await fetchItemMatches(source.id);
      for (const match of matches) {
        results.push({
          report: match.report,
          similarity: match.similarity,
          sourceReportId: source.id,
          sourceTitle: source.title,
        });
      }
    } catch (caught) {
      if (caught instanceof ReportServiceError && caught.kind === "not_found") {
        continue;
      }
      throw caught;
    }
  }

  return results.sort((left, right) => right.similarity - left.similarity);
}
