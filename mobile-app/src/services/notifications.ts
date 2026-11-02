import type { AppNotification } from "../types/notification";
import { apiRequest } from "./http";
import { mapNotification, mapNotificationList } from "./mapNotification";
import { shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import {
  listMockNotifications,
  markAllMockNotificationsRead,
  markMockNotificationRead,
} from "./mockNotifications";

export async function listNotifications(userId?: string, accessToken?: string): Promise<AppNotification[]> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to view notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    requireToken(accessToken);
    return mapNotificationList(await apiRequest("/notifications", { accessToken }));
  }
  return listMockNotifications(userId);
}

export async function markNotificationRead(
  notificationId: string,
  userId?: string,
  accessToken?: string,
): Promise<AppNotification> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to update notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    requireToken(accessToken);
    return mapNotification(await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "PATCH", accessToken,
    }));
  }
  return markMockNotificationRead(notificationId, userId);
}

export async function markAllNotificationsRead(userId?: string, accessToken?: string): Promise<void> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to update notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    requireToken(accessToken);
    await apiRequest("/notifications/read-all", { method: "POST", accessToken });
    return;
  }
  markAllMockNotificationsRead(userId);
}

export function notificationsUseMockData(): boolean {
  return shouldUseMockData();
}


function requireToken(token?: string): void {
  if (!token) throw new ReportServiceError("Sign in to view or update notifications.", "authentication");
}
