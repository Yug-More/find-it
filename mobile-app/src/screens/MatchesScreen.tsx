import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MatchCard } from "../components/matches/MatchCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, layout, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { listMatchesForUser } from "../services/matches";
import type { MatchResult } from "../types/match";

export function MatchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!user?.id) {
        setError("Sign in to view matches for your reports.");
        setLoading(false);
        return;
      }
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        setMatches(await listMatchesForUser(user.id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Matches could not be loaded.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void load("initial");
    }, [load]),
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading matches" />;
  }

  if (error && matches.length === 0) {
    return <ErrorState message={error} onRetry={() => void load("initial")} />;
  }

  return (
    <FlatList
      style={styles.screen}
      data={matches}
      keyExtractor={(item) => `${item.sourceReportId}-${item.report.id}`}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load("refresh")}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <Text style={styles.intro}>
          Matches come from the FindIt API similarity score. The app shows that score and does not
          invent why two reports look alike.
        </Text>
      }
      ListEmptyComponent={
        <EmptyState
          title="No matches yet"
          message="When a similar opposite report is found for one of your reports, it will show up here."
        />
      }
      renderItem={({ item }) => (
        <MatchCard
          match={item}
          onPress={() =>
            navigation.navigate("ReportDetails", { reportId: item.report.id, origin: "browse" })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm + spacing.xs,
    flexGrow: 1,
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
