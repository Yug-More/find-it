import type { AppNotification, NotificationKind } from "../types/notification";

let notifications: AppNotification[] = seed();
let nextNumber = 3;

export function listMockNotifications(userId: string): AppNotification[] {
  return clone(notifications.filter((item) => item.userId === userId)).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function markMockNotificationRead(notificationId: string, userId: string): AppNotification {
  const current = notifications.find((item) => item.id === notificationId && item.userId === userId);
  if (!current) {
    throw new Error("Notification not found");
  }
  const updated = { ...current, read: true };
  notifications = notifications.map((item) => (item.id === notificationId ? updated : item));
  return { ...updated };
}

export function markAllMockNotificationsRead(userId: string): void {
  notifications = notifications.map((item) =>
    item.userId === userId ? { ...item, read: true } : item,
  );
}

export function addMockNotification(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  reportId: string | null;
  claimId?: string | null;
}): AppNotification {
  const notification: AppNotification = {
    id: `note-local-${nextNumber}`,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    read: false,
    reportId: input.reportId,
    claimId: input.claimId ?? null,
  };
  nextNumber += 1;
  notifications = [notification, ...notifications];
  return { ...notification };
}

export function resetMockNotifications(): void {
  notifications = seed();
  nextNumber = 3;
}

function seed(): AppNotification[] {
  return [
    {
      id: "note-1",
      userId: "user-1",
      kind: "match",
      title: "Possible match found",
      body: "A found report looks similar to your Toyota key fob.",
      createdAt: "2026-01-25T21:00:00.000Z",
      read: false,
      reportId: "sample-lost-keys",
      claimId: null,
    },
    {
      id: "note-2",
      userId: "user-1",
      kind: "claim",
      title: "New ownership claim",
      body: "Someone claimed your Toyota key fob.",
      createdAt: "2026-01-23T15:05:00.000Z",
      read: false,
      reportId: "sample-lost-keys",
      claimId: "claim-sample-1",
    },
  ];
}

function clone(items: AppNotification[]): AppNotification[] {
  return items.map((item) => ({ ...item }));
}
