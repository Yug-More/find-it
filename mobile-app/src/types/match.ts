import type { Report } from "./report";

export type MatchResult = {
  report: Report;
  similarity: number;
  sourceReportId: string;
  sourceTitle: string;
};
