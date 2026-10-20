import type { Claim, ClaimInput, ClaimStatus } from "../types/claim";
import { ReportServiceError } from "./errors";
import { getMockReport, listMockReports, updateMockReportStatus } from "./mockReports";
import { addMockNotification } from "./mockNotifications";

let claims: Claim[] = [
  {
    id: "claim-sample-1",
    itemId: "sample-lost-keys",
    claimantId: "other-user",
    message: "The fob has a black Toyota logo and a scratched house key on the same ring.",
    status: "pending",
    createdAt: "2026-01-23T15:00:00.000Z",
    itemTitle: "Toyota key fob",
  },
];
let nextNumber = 2;

export function listMockClaimsForItem(itemId: string, requesterId: string): Claim[] {
  const item = getMockReport(itemId);
  if (item.userId !== requesterId) {
    throw new ReportServiceError("Only the item owner can view its claims", "forbidden");
  }
  return clone(claims.filter((claim) => claim.itemId === itemId)).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function listMockClaimsForUser(userId: string): Claim[] {
  const ownedIds = new Set(listMockReports().filter((report) => report.userId === userId).map((r) => r.id));
  return clone(
    claims.filter((claim) => claim.claimantId === userId || ownedIds.has(claim.itemId)),
  )
    .map((claim) => ({
      ...claim,
      itemTitle: safeTitle(claim.itemId),
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function createMockClaim(itemId: string, claimantId: string, input: ClaimInput): Claim {
  const item = getMockReport(itemId);
  if (item.userId === claimantId) {
    throw new ReportServiceError("You cannot claim your own item", "validation");
  }
  if (item.status !== "open") {
    throw new ReportServiceError("This report is no longer open for claims.", "validation");
  }

  const claim: Claim = {
    id: `claim-local-${nextNumber}`,
    itemId,
    claimantId,
    message: input.message.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    itemTitle: item.title,
  };
  nextNumber += 1;
  claims = [claim, ...claims];
  addMockNotification({
    userId: item.userId,
    kind: "claim",
    title: "New ownership claim",
    body: `Someone claimed ${item.title}. Review the explanation before you decide.`,
    reportId: item.id,
    claimId: claim.id,
  });
  return { ...claim };
}

export function updateMockClaimStatus(
  claimId: string,
  requesterId: string,
  status: ClaimStatus,
): Claim {
  const current = claims.find((claim) => claim.id === claimId);
  if (!current) {
    throw new ReportServiceError("Claim not found", "not_found");
  }
  const item = getMockReport(current.itemId);
  if (item.userId !== requesterId) {
    throw new ReportServiceError("Only the item owner can update this claim", "forbidden");
  }

  const updated: Claim = {
    ...current,
    status,
    itemTitle: item.title,
  };
  claims = claims.map((claim) => (claim.id === claimId ? updated : claim));

  if (status === "approved") {
    updateMockReportStatus(item.id, "resolved");
  }

  addMockNotification({
    userId: current.claimantId,
    kind: "claim_update",
    title: status === "approved" ? "Claim approved" : "Claim rejected",
    body:
      status === "approved"
        ? `Your claim for ${item.title} was approved.`
        : `Your claim for ${item.title} was rejected.`,
    reportId: item.id,
    claimId: current.id,
  });

  return { ...updated };
}

export function resetMockClaims(): void {
  claims = [
    {
      id: "claim-sample-1",
      itemId: "sample-lost-keys",
      claimantId: "other-user",
      message: "The fob has a black Toyota logo and a scratched house key on the same ring.",
      status: "pending",
      createdAt: "2026-01-23T15:00:00.000Z",
      itemTitle: "Toyota key fob",
    },
  ];
  nextNumber = 2;
}

function safeTitle(itemId: string): string {
  try {
    return getMockReport(itemId).title;
  } catch {
    return "Report";
  }
}

function clone(items: Claim[]): Claim[] {
  return items.map((item) => ({ ...item }));
}
