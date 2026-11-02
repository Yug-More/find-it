import type { AppNotification, NotificationKind } from "../types/notification";
import { ReportServiceError } from "./errors";
import { isRecord } from "./mapReport";

const KINDS: readonly NotificationKind[] = ["match", "claim", "claim_update", "report"];

export function mapNotification(value: unknown): AppNotification {
  if (!isRecord(value) || typeof value.is_read !== "boolean" ||
      !KINDS.includes(value.kind as NotificationKind)) {
    throw new ReportServiceError("The server returned an unreadable notification.", "network");
  }
  const text = (key: string): string => {
    const item = value[key];
    if (typeof item !== "string" || !item) {
      throw new ReportServiceError("The server returned an unreadable notification.", "network");
    }
    return item;
  };
  const optionalId = (key: string) => value[key] == null ? null : text(key);
  return {
    id: text("id"), userId: text("user_id"), kind: value.kind as NotificationKind,
    title: text("title"), body: text("body"), createdAt: text("created_at"),
    read: value.is_read, reportId: optionalId("item_id"), claimId: optionalId("claim_id"),
  };
}

export function mapNotificationList(value: unknown): AppNotification[] {
  if (!Array.isArray(value)) {
    throw new ReportServiceError("The server returned an unreadable notification list.", "network");
  }
  return value.map(mapNotification);
}
