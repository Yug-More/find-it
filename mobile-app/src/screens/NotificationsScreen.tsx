import { useCallback, useRef, useState } from "react";
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
  const { user, session } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actionBusy = useRef(false);
  const generation = useRef(0);
  const focused = useRef(false);
  const mockOnly = notificationsUseMockData();

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (actionBusy.current || !focused.current) return;
      const request = ++generation.current;
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
        const next = await listNotifications(user.id, session?.access_token);
        if (request === generation.current) setItems(next);
      } catch (caught) {
        if (request === generation.current) {
          setError(caught instanceof Error ? caught.message : "Notifications could not be loaded.");
        }
      } finally {
        if (request === generation.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user, session],
  );

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setBusy(actionBusy.current);
      void load("initial");
      return () => { focused.current = false; generation.current += 1; };
    }, [load]),
  );

  async function runAction(action: () => Promise<void>) {
    if (actionBusy.current) return;
    actionBusy.current = true;
    const request = ++generation.current;
    setBusy(true);
    setRefreshing(false);
    setError(null);
    try {
      await action();
    } catch (caught) {
      if (request === generation.current) {
        setError(caught instanceof Error ? caught.message : "The notification could not be updated. Try again.");
      }
    } finally {
      actionBusy.current = false;
      if (focused.current) setBusy(false);
    }
  }

  async function openNotification(notification: AppNotification) {
    await runAction(async () => {
      const request = generation.current;
      if (!notification.read) {
        const updated = await markNotificationRead(notification.id, user?.id, session?.access_token);
        if (request !== generation.current) return;
        setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
      if (!focused.current || request !== generation.current) return;
      if (notification.reportId) {
        navigation.navigate("ReportDetails", { reportId: notification.reportId, origin: "browse" });
      } else if (notification.claimId) {
        navigation.navigate("Claims");
      }
    });
  }

  async function markAll() {
    await runAction(async () => {
      const request = generation.current;
      const unreadIds = new Set(items.filter((item) => !item.read).map((item) => item.id));
      await markAllNotificationsRead(user?.id, session?.access_token);
      if (request !== generation.current) return;
      setItems((current) => current.map((item) => unreadIds.has(item.id) ? { ...item, read: true } : item));
    });
  }

  const unreadCount = items.filter((item) => !item.read).length;

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
              : "Updates about ownership claims on your reports and claims you submit."}
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.intro}>{unreadCount} unread</Text>
          {error ? (
            <View>
              <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
              <Button label="Try again" variant="text" disabled={busy} onPress={() => void load("refresh")} />
            </View>
          ) : null}
          {unreadCount > 0 ? (
            <Button label="Mark all as read" disabled={busy} variant="text" onPress={() => void markAll()} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No notifications"
          message={
            mockOnly
              ? "Match and claim updates will appear here while you use mock mode."
              : "Updates will appear when a claim is submitted, approved, or rejected."
          }
        />
      }
      renderItem={({ item }) => (
        <NotificationRow notification={item} disabled={busy} onPress={() => void openNotification(item)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  error: { ...typography.body, color: colors.error },
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
