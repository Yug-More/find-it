import { StyleSheet, Text, View } from "react-native";

import { colors, elevation, radius, spacing, typography } from "../../constants/theme";
import type { Claim } from "../../types/claim";
import { formatCreatedAt } from "../../utils/dates";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

type Props = {
  claim: Claim;
  canDecide?: boolean;
  busy?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onOpenReport?: () => void;
};

export function ClaimCard({
  claim,
  canDecide = false,
  busy = false,
  onApprove,
  onReject,
  onOpenReport,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {claim.itemTitle ?? "Report claim"}
        </Text>
        <StatusBadge label={claimStatusLabel(claim.status)} tone={claimStatusTone(claim.status)} />
      </View>
      <Text style={styles.label}>Ownership explanation</Text>
      <Text style={styles.message}>{claim.message}</Text>
      <Text style={styles.meta}>Submitted {formatCreatedAt(claim.createdAt)}</Text>
      {onOpenReport ? (
        <Button label="View report" variant="outline" onPress={onOpenReport} disabled={busy} />
      ) : null}
      {canDecide && claim.status === "pending" ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label="Approve" onPress={onApprove ?? (() => undefined)} disabled={busy} />
          </View>
          <View style={styles.action}>
            <Button
              label="Reject"
              variant="destructive"
              onPress={onReject ?? (() => undefined)}
              disabled={busy}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function claimStatusLabel(status: Claim["status"]): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

export function claimStatusTone(status: Claim["status"]): "success" | "warning" | "neutral" {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "warning";
    default:
      return "neutral";
  }
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...elevation.soft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  message: {
    ...typography.body,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
