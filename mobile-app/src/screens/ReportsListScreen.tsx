import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportCard } from "../components/reports/ReportCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, spacing, typography } from "../constants/theme";
import { useReports } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";

export function ReportsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reports, loading, refreshing, error, retry, refresh } = useReports();

  if (loading && !refreshing) {
    return <LoadingState message="Loading reports" />;
  }

  if (error && reports.length === 0) {
    return <ErrorState message={error} onRetry={() => void retry()} />;
  }

  return (
    <FlatList
      data={reports}
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
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          title="No reports yet"
          message="Submitted lost and found reports will show up here."
        />
      }
      renderItem={({ item }) => (
        <ReportCard
          report={item}
          onPress={() => navigation.navigate("ReportDetails", { reportId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.sm + spacing.xs,
    flexGrow: 1,
    backgroundColor: colors.background,
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
