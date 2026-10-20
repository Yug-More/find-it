import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { NotificationRow } from "../components/notifications/NotificationRow";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, layout, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsUseMockData,
} from "../services/notifications";
import type { AppNotification } from "../types/notification";

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockOnly = notificationsUseMockData();

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!user?.id) {
        setError("Sign in to view notifications.");
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
        setItems(await listNotifications(user.id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Notifications could not be loaded.");
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

  async function openNotification(notification: AppNotification) {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id, user?.id);
        setItems((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        );
      } catch {
        // Opening the related report still helps even if the read mark fails.
      }
    }
    if (notification.reportId) {
      navigation.navigate("ReportDetails", {
        reportId: notification.reportId,
        origin: "browse",
      });
    }
  }

  async function markAll() {
    await markAllNotificationsRead(user?.id);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  if (loading && !refreshing) {
    return <LoadingState message="Loading notifications" />;
  }

  if (error && items.length === 0) {
    return <ErrorState message={error} onRetry={() => void load("initial")} />;
  }

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load("refresh")}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.intro}>
            {mockOnly
              ? "These sample notifications stay on this device while mock mode is on."
              : "A live notification API is not available yet. This list stays empty until one is added."}
          </Text>
          {mockOnly && items.some((item) => !item.read) ? (
            <Button label="Mark all as read" variant="text" onPress={() => void markAll()} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No notifications"
          message={
            mockOnly
              ? "Match and claim updates will appear here while you use mock mode."
              : "Live notifications need a backend endpoint before they can appear here."
          }
        />
      }
      renderItem={({ item }) => (
        <NotificationRow notification={item} onPress={() => void openNotification(item)} />
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
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
