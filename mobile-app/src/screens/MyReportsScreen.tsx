import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportCard } from "../components/reports/ReportCard";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import { deleteReport } from "../services/reports";
import type { Report } from "../types/report";
import { reportsForUser } from "../utils/filters";
import { ownsReport } from "../utils/ownership";

export function MyReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const { reports, loading, refreshing, error, retry, refresh } = useReports();
  const mine = reportsForUser(reports, user?.id ?? "");
  const [pending, setPending] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pending || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteReport(pending.id, session?.access_token, user?.id);
      setPending(null);
      await refresh();
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "The report could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !refreshing) {
    return <LoadingState message="Loading your reports" />;
  }

  if (error && reports.length === 0) {
    return <ErrorState message={error} onRetry={() => void retry()} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.listView}
        data={mine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.inlineError}>
              <Text accessibilityRole="alert" style={styles.inlineErrorText}>
                {error}
              </Text>
              <Button label="Try again" variant="text" onPress={() => void refresh()} />
            </View>
          ) : (
            <Text style={styles.count}>{mine.length === 1 ? "1 report" : `${mine.length} reports`}</Text>
          )
        }
        ListEmptyComponent={
          <EmptyState
            title="No reports yet"
            message="Reports you submit will show up here."
          />
        }
        renderItem={({ item }) => {
          const owner = ownsReport(user?.id, item.userId);
          return (
            <ReportCard
              report={item}
              onPress={() => navigation.navigate("ReportDetails", { reportId: item.id, origin: "mine" })}
              onEdit={
                owner ? () => navigation.navigate("EditReport", { reportId: item.id }) : undefined
              }
              onDelete={
                owner
                  ? () => {
                      setDeleteError(null);
                      setPending(item);
                    }
                  : undefined
              }
            />
          );
        }}
      />
      <ConfirmDialog
        visible={pending !== null}
        title="Delete this report?"
        message={
          pending
            ? `Delete ${pending.title}? This removes the report from FindIt.`
            : "Delete this report?"
        }
        confirmLabel={deleting ? "Deleting" : "Delete"}
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          if (!deleting) {
            setPending(null);
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listView: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm + spacing.xs,
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  count: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inlineError: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inlineErrorText: {
    ...typography.body,
    color: colors.error,
  },
});
