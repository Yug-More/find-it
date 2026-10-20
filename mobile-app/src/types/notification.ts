export type NotificationKind = "match" | "claim" | "claim_update" | "report";

export type AppNotification = {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  reportId: string | null;
  claimId: string | null;
};
