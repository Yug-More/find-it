import type { AppNotification } from "../types/notification";
import { shouldUseMockData } from "./config";
import { ReportServiceError } from "./errors";
import {
  listMockNotifications,
  markAllMockNotificationsRead,
  markMockNotificationRead,
} from "./mockNotifications";

export async function listNotifications(userId?: string): Promise<AppNotification[]> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to view notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    return [];
  }
  return listMockNotifications(userId);
}

export async function markNotificationRead(
  notificationId: string,
  userId?: string,
): Promise<AppNotification> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to update notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    throw new ReportServiceError(
      "Live notifications are not available until a notification API is added.",
      "configuration",
    );
  }
  return markMockNotificationRead(notificationId, userId);
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (!userId) {
    throw new ReportServiceError("Sign-in is required to update notifications.", "authentication");
  }
  if (!shouldUseMockData()) {
    return;
  }
  markAllMockNotificationsRead(userId);
}

export function notificationsUseMockData(): boolean {
  return shouldUseMockData();
}
