import type { Profile, UserRole } from "../types/auth";
import type { Claim, ClaimStatus } from "../types/claim";
import type { ItemStatus, Report } from "../types/report";
import { ReportServiceError } from "./errors";
import { apiRequest } from "./http";
import { mapClaimList } from "./mapClaim";
import { isRecord, mapItem, mapItemList } from "./mapReport";

const ROLES: readonly UserRole[] = ["user", "admin"];

export async function fetchMyProfile(accessToken: string): Promise<Profile> {
  return mapProfile(await apiRequest("/auth/me", { accessToken }));
}

export async function listAdminUsers(accessToken: string): Promise<Profile[]> {
  const value = await apiRequest("/admin/users", { accessToken });
  if (!Array.isArray(value)) {
    throw new ReportServiceError("The server returned an unreadable user list.", "network");
  }
  return value.map((item) => mapProfile(item));
}

export async function listAdminItems(
  accessToken: string,
  status?: ItemStatus,
): Promise<Report[]> {
  const path = status ? `/admin/items?status=${encodeURIComponent(status)}` : "/admin/items";
  return mapItemList(await apiRequest(path, { accessToken }));
}

export async function updateAdminItemStatus(
  reportId: string,
  status: ItemStatus,
  accessToken: string,
): Promise<Report> {
  return mapItem(
    await apiRequest(`/admin/items/${encodeURIComponent(reportId)}`, {
      method: "PATCH",
      accessToken,
      body: { status },
    }),
  );
}

export async function deleteAdminItem(reportId: string, accessToken: string): Promise<void> {
  await apiRequest(`/admin/items/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function listAdminClaims(
  accessToken: string,
  status?: ClaimStatus,
): Promise<Claim[]> {
  const path = status ? `/admin/claims?status=${encodeURIComponent(status)}` : "/admin/claims";
  return mapClaimList(await apiRequest(path, { accessToken }));
}

function mapProfile(value: unknown): Profile {
  if (!isRecord(value)) {
    throw new ReportServiceError("The server returned an unreadable profile.", "network");
  }

  const role = value.role;
  if (role !== undefined && !isUserRole(role)) {
    throw new ReportServiceError("The server returned an unreadable profile role.", "network");
  }

  return {
    id: requiredString(value, "id"),
    email: requiredString(value, "email"),
    fullName: optionalString(value, "full_name"),
    role: role === undefined ? "user" : role,
    createdAt: requiredString(value, "created_at"),
  };
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ROLES.includes(value as UserRole);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ReportServiceError(`The server response is missing ${key}.`, "network");
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value == null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ReportServiceError(`The server response has an invalid ${key}.`, "network");
  }
  return value;
}
