import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";
import type { AppNotification } from "../../types/notification";
import { formatCreatedAt } from "../../utils/dates";

type Props = {
  notification: AppNotification;
  onPress: () => void;
};

export function NotificationRow({ notification, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.read ? "" : "Unread. "}${notification.title}. ${notification.body}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !notification.read && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.meta}>{formatCreatedAt(notification.createdAt)}</Text>
      </View>
      {!notification.read ? <View accessibilityLabel="Unread" style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  unread: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  pressed: {
    opacity: 0.88,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing.xs,
    backgroundColor: colors.accent,
  },
});
