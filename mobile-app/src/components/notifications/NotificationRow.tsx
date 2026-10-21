import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, iconSize, spacing, typography } from "../../constants/theme";
import type { AppNotification } from "../../types/notification";
import { formatCreatedAt } from "../../utils/dates";

type Props = {
  notification: AppNotification;
  onPress: () => void;
};

export function NotificationRow({ notification, onPress }: Props) {
  const icon = iconForKind(notification.kind);

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
      <View style={[styles.iconWrap, !notification.read && styles.iconUnread]}>
        <Ionicons name={icon} size={iconSize.md} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.meta}>{formatCreatedAt(notification.createdAt)}</Text>
      </View>
      {!notification.read ? <View accessibilityLabel="Unread" style={styles.dot} /> : null}
    </Pressable>
  );
}

function iconForKind(kind: AppNotification["kind"]): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case "match":
      return "git-compare-outline";
    case "claim":
      return "shield-checkmark-outline";
    default:
      return "notifications-outline";
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  unread: {
    backgroundColor: colors.accentMuted,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    marginTop: 2,
  },
  iconUnread: {
    backgroundColor: colors.surface,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
    backgroundColor: colors.accent,
  },
});
