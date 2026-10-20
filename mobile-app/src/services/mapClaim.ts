import type { Claim, ClaimStatus } from "../types/claim";
import type { Report } from "../types/report";
import { ReportServiceError } from "./errors";
import { isRecord, mapItem } from "./mapReport";

const CLAIM_STATUSES: readonly ClaimStatus[] = ["pending", "approved", "rejected"];

export type MappedMatch = {
  report: Report;
  similarity: number;
};

export function mapClaim(value: unknown): Claim {
  if (!isRecord(value)) {
    throw new ReportServiceError("The server returned an unreadable claim.", "network");
  }

  const status = value.status;
  if (!isClaimStatus(status)) {
    throw new ReportServiceError("The server returned an unreadable claim.", "network");
  }

  return {
    id: requiredString(value, "id"),
    itemId: requiredString(value, "item_id"),
    claimantId: requiredString(value, "claimant_id"),
    message: requiredString(value, "message"),
    status,
    createdAt: requiredString(value, "created_at"),
  };
}

export function mapClaimList(value: unknown): Claim[] {
  if (!Array.isArray(value)) {
    throw new ReportServiceError("The server returned an unreadable claim list.", "network");
  }
  return value.map((item) => mapClaim(item));
}

export function mapMatchPayload(value: unknown): MappedMatch {
  if (!isRecord(value)) {
    throw new ReportServiceError("The server returned an unreadable match.", "network");
  }
  if (!("item" in value) || typeof value.similarity !== "number") {
    throw new ReportServiceError("The server returned an unreadable match.", "network");
  }
  return {
    report: mapItem(value.item),
    similarity: value.similarity,
  };
}

export function mapMatchList(value: unknown): MappedMatch[] {
  if (!Array.isArray(value)) {
    throw new ReportServiceError("The server returned an unreadable match list.", "network");
  }
  return value.map((item) => mapMatchPayload(item));
}

function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === "string" && CLAIM_STATUSES.includes(value as ClaimStatus);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ReportServiceError(`The server response is missing ${key}.`, "network");
  }
  return value;
}
