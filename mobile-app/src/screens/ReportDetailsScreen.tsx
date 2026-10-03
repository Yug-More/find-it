import { StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { Screen } from "../components/ui/Screen";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../components/ui/StatusBadge";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useReport } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import { formatCreatedAt, formatItemDate } from "../utils/dates";

export function ReportDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ReportDetails">>();
  const { report, loading, error, retry } = useReport(route.params.reportId);

  if (loading) {
    return <LoadingState message="Loading report" />;
  }

  if (error || !report) {
    return (
      <ErrorState
        message={error ?? "That report could not be found."}
        onRetry={() => void retry()}
      />
    );
  }

  const typeBadge = reportTypeBadge(report.type);
  const statusBadge = reportStatusBadge(report.status);
  const dateLabel = report.type === "lost" ? "Date lost" : "Date found";

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {report.title}
        </Text>
        <View style={styles.badges}>
          <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
          <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
        </View>
        <Detail label="Category" value={report.category ?? "Not provided"} />
        <Detail label="Description" value={report.description} />
        <Detail label="Color" value={report.color ?? "Not provided"} />
        <Detail label="Location" value={report.location ?? "Not provided"} />
        <Detail label={dateLabel} value={formatItemDate(report.eventDate)} />
        <Detail label="Status" value={statusBadge.label} />
        <Detail label="Submitted" value={formatCreatedAt(report.createdAt)} />
      </View>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detail: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
  },
});
