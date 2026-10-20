import { apiRequest } from "./http";
import { mapClaim, mapClaimList, mapMatchList } from "./mapClaim";
import { mapItem, mapItemList, toItemCreate } from "./mapReport";
import type { Claim, ClaimInput, ClaimStatus } from "../types/claim";
import type { Report, ReportInput } from "../types/report";

export async function fetchItems(): Promise<Report[]> {
  return mapItemList(await apiRequest("/items"));
}

export async function fetchItem(reportId: string): Promise<Report> {
  return mapItem(await apiRequest(`/items/${encodeURIComponent(reportId)}`));
}

export async function createItem(input: ReportInput, accessToken: string): Promise<Report> {
  return mapItem(
    await apiRequest("/items", {
      method: "POST",
      accessToken,
      body: toItemCreate(input),
    }),
  );
}

export async function updateItem(
  reportId: string,
  input: ReportInput,
  accessToken: string,
): Promise<Report> {
  return mapItem(
    await apiRequest(`/items/${encodeURIComponent(reportId)}`, {
      method: "PATCH",
      accessToken,
      body: toItemCreate(input),
    }),
  );
}

export async function deleteItem(reportId: string, accessToken: string): Promise<void> {
  await apiRequest(`/items/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function fetchItemMatches(reportId: string) {
  return mapMatchList(await apiRequest(`/items/${encodeURIComponent(reportId)}/matches`));
}

export async function createClaimApi(
  reportId: string,
  input: ClaimInput,
  accessToken: string,
): Promise<Claim> {
  return mapClaim(
    await apiRequest(`/items/${encodeURIComponent(reportId)}/claims`, {
      method: "POST",
      accessToken,
      body: { message: input.message },
    }),
  );
}

export async function fetchItemClaims(reportId: string, accessToken: string): Promise<Claim[]> {
  return mapClaimList(
    await apiRequest(`/items/${encodeURIComponent(reportId)}/claims`, {
      accessToken,
    }),
  );
}

export async function updateClaimStatusApi(
  claimId: string,
  status: ClaimStatus,
  accessToken: string,
): Promise<Claim> {
  return mapClaim(
    await apiRequest(`/claims/${encodeURIComponent(claimId)}`, {
      method: "PATCH",
      accessToken,
      body: { status },
    }),
  );
}
