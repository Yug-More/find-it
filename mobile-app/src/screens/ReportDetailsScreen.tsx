import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportImage } from "../components/reports/ReportImage";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { Screen } from "../components/ui/Screen";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../components/ui/StatusBadge";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useReport } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import { deleteReport } from "../services/reports";
import { formatCreatedAt, formatItemDate } from "../utils/dates";
import { ownsReport } from "../utils/ownership";

export function ReportDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ReportDetails">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const { report, loading, error, retry } = useReport(route.params.reportId);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const owner = report ? ownsReport(user?.id, report.userId) : false;

  async function confirmDelete() {
    if (!report || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteReport(report.id, session?.access_token, user?.id);
      navigation.navigate(route.params.origin === "mine" ? "MyReports" : "Reports");
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "The report could not be deleted.");
      setDeleting(false);
    }
  }

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
    <View style={styles.screen}>
      <Screen scroll>
        <View style={styles.card}>
          <ReportImage uri={report.imageUrl} label={`Photo of ${report.title}`} />
          <Text accessibilityRole="header" style={styles.title}>
            {report.title}
          </Text>
          <View style={styles.badges}>
            <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
            <StatusBadge label={report.category ?? "No category"} tone="neutral" />
            <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
          </View>
        <Detail label="Description" value={report.description} />
        <View style={styles.pair}>
          <Detail label="Color" value={report.color ?? "Not provided"} />
          <Detail label="Brand" value={report.brand ?? "Not provided"} />
        </View>
        <Detail label="Location" value={report.location ?? "Not provided"} />
        <View style={styles.pair}>
          <Detail label={dateLabel} value={formatItemDate(report.eventDate)} />
          <Detail label="Status" value={statusBadge.label} />
        </View>
        <Detail label="Submitted" value={formatCreatedAt(report.createdAt)} />
        </View>
        {owner ? (
          <View style={styles.actions}>
            <Button
              label="Edit report"
              variant="outline"
              onPress={() => navigation.navigate("EditReport", { reportId: report.id })}
              disabled={deleting}
            />
            <Button
              label="Delete report"
              variant="destructive"
              onPress={() => {
                setDeleteError(null);
                setConfirming(true);
              }}
              disabled={deleting}
            />
          </View>
        ) : null}
      </Screen>
      <ConfirmDialog
        visible={confirming}
        title="Delete this report?"
        message={`Delete ${report.title}? This removes the report from FindIt.`}
        confirmLabel={deleting ? "Deleting" : "Delete"}
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          if (!deleting) {
            setConfirming(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </View>
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
  screen: {
    flex: 1,
  },
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
    flexShrink: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pair: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  detail: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  actions: {
    gap: spacing.sm,
  },
});
