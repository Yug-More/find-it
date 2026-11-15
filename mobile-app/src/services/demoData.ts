import { createMockReport, resetMockReports, updateMockReportStatus } from "./mockReports";
import { createMockClaim, resetMockClaims, updateMockClaimStatus } from "./mockClaims";
import { addMockNotification, resetMockNotifications, markMockNotificationRead } from "./mockNotifications";
import type { ReportInput } from "../types/report";

/** Reset the local demonstration; never calls a hosted service. */
export function resetDemoData(): void {
  resetMockReports();
  resetMockClaims();
  resetMockNotifications();
}

export function prepareDemoData(): void {
  resetDemoData();
  const examples = [
    ["found", "Toyota key fob found", "Keys", "West Parking Garage"],
    ["lost", "Blue backpack", "Wallets and Bags", "King Library"],
    ["found", "Wireless headphones", "Electronics", "Student Union"],
    ["lost", "Student ID in plain sleeve", "Documents", "Engineering Building"],
    ["found", "Gray jacket", "Clothing", "Tower Lawn"],
  ] as const;
  const created = examples.map(([type, title, category, location], index) =>
    createMockReport({ type, title, category, location, description: `${title}. Demonstration item with no personal information.`,
      color: "", brand: "", eventDate: `2026-11-${10 + index}`, image: null, imageUrl: null } satisfies ReportInput,
    "other-user"));
  const approved = createMockClaim(created[1].id, "user-1", { message: "The backpack has a stitched star inside the front pocket." });
  updateMockClaimStatus(approved.id, "other-user", "approved");
  const rejected = createMockClaim(created[2].id, "user-1", { message: "The case has a small scratch beneath the hinge." });
  updateMockClaimStatus(rejected.id, "other-user", "rejected");
  updateMockReportStatus(created[4].id, "resolved");
  const read = addMockNotification({ userId: "user-1", kind: "report", title: "Demo history ready",
    body: "Sample claim decisions are available in Claims.", reportId: created[1].id });
  markMockNotificationRead(read.id, "user-1");
}
