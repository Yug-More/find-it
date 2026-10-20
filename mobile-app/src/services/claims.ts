import type { Claim, ClaimInput, ClaimStatus } from "../types/claim";
import { shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import {
  createMockClaim,
  listMockClaimsForItem,
  listMockClaimsForUser,
  updateMockClaimStatus,
} from "./mockClaims";
import {
  createClaimApi,
  fetchItemClaims,
  fetchItems,
  updateClaimStatusApi,
} from "./reportsApi";

const MISSING_ACCOUNT = "Sign-in is required before a claim can be submitted.";

export async function listClaimsForItem(
  reportId: string,
  accessToken?: string,
  userId?: string,
): Promise<Claim[]> {
  if (shouldUseMockData()) {
    if (!userId) {
      throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
    }
    return listMockClaimsForItem(reportId, userId);
  }
  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  return fetchItemClaims(reportId, accessToken);
}

export async function listClaimsForUser(
  accessToken?: string,
  userId?: string,
): Promise<Claim[]> {
  if (!userId) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }

  if (shouldUseMockData()) {
    return listMockClaimsForUser(userId);
  }

  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }

  const items = await fetchItems();
  const owned = items.filter((item) => item.userId === userId);
  const results: Claim[] = [];

  for (const item of owned) {
    try {
      const claims = await fetchItemClaims(item.id, accessToken);
      results.push(...claims.map((claim) => ({ ...claim, itemTitle: item.title })));
    } catch (caught) {
      if (caught instanceof ReportServiceError && caught.kind === "forbidden") {
        continue;
      }
      throw caught;
    }
  }

  return results.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function submitClaim(
  reportId: string,
  input: ClaimInput,
  accessToken?: string,
  userId?: string,
): Promise<Claim> {
  if (shouldUseMockData()) {
    if (!userId) {
      throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
    }
    return createMockClaim(reportId, userId, input);
  }
  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  return createClaimApi(reportId, input, accessToken);
}

export async function setClaimStatus(
  claimId: string,
  status: ClaimStatus,
  accessToken?: string,
  userId?: string,
): Promise<Claim> {
  if (shouldUseMockData()) {
    if (!userId) {
      throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
    }
    return updateMockClaimStatus(claimId, userId, status);
  }
  if (!accessToken) {
    throw new ReportServiceError(MISSING_ACCOUNT, "authentication");
  }
  return updateClaimStatusApi(claimId, status, accessToken);
}
