import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReportCard } from "../components/reports/ReportCard";
import { ReportFiltersBar } from "../components/reports/ReportFiltersBar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, layout, spacing, typography } from "../constants/theme";
import { useReports } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import type { ReportFilters } from "../types/report";
import { activeFilterCount, EMPTY_FILTERS, filterReports } from "../utils/filters";

export function ReportsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reports, loading, refreshing, error, retry, refresh } = useReports();
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const visible = filterReports(reports, filters);
  const filtering = activeFilterCount(filters) > 0;

  if (loading && !refreshing) {
    return <LoadingState message="Loading reports" />;
  }

  if (error && reports.length === 0) {
    return <ErrorState message={error} onRetry={() => void retry()} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        style={styles.listView}
        data={visible}
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
          <View>
            <Text accessibilityRole="header" style={styles.screenTitle}>
              Reports
            </Text>
            {error ? (
              <View style={styles.inlineError}>
                <Text accessibilityRole="alert" style={styles.inlineErrorText}>
                  {error}
                </Text>
                <Button label="Try again" variant="text" onPress={() => void refresh()} />
              </View>
            ) : null}
            <ReportFiltersBar filters={filters} resultCount={visible.length} onChange={setFilters} />
          </View>
        }
        ListEmptyComponent={
          filtering ? (
            <EmptyState
              title="No matching reports"
              message="Try a different search or clear the filters."
            />
          ) : (
            <EmptyState
              title="No reports yet"
              message="Submitted lost and found reports will show up here."
            />
          )
        }
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() =>
              navigation.navigate("ReportDetails", { reportId: item.id, origin: "browse" })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listView: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  screenTitle: {
    ...typography.title,
    color: colors.text,
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
