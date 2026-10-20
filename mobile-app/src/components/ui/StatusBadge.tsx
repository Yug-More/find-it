import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";
import type { ItemStatus, ItemType } from "../../types/report";

type Tone = "neutral" | "warning" | "success" | "info" | "danger";

type Props = {
  label: string;
  tone: Tone;
};

export function StatusBadge({ label, tone }: Props) {
  return (
    <View
      style={[
        styles.badge,
        tone === "warning" && styles.warning,
        tone === "success" && styles.success,
        tone === "neutral" && styles.neutral,
        tone === "info" && styles.info,
        tone === "danger" && styles.danger,
      ]}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.text,
          tone === "warning" && styles.warningText,
          tone === "success" && styles.successText,
          tone === "neutral" && styles.neutralText,
          tone === "info" && styles.infoText,
          tone === "danger" && styles.dangerText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function reportTypeBadge(type: ItemType): Props {
  return type === "lost"
    ? { label: "Lost", tone: "warning" }
    : { label: "Found", tone: "success" };
}

export function reportStatusBadge(status: ItemStatus): Props {
  return status === "resolved"
    ? { label: "Resolved", tone: "success" }
    : { label: "Open", tone: "neutral" };
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: colors.lostMuted,
    borderColor: colors.lost,
  },
  success: {
    backgroundColor: colors.foundMuted,
    borderColor: colors.found,
  },
  neutral: {
    backgroundColor: colors.background,
    borderColor: colors.borderStrong,
  },
  info: {
    backgroundColor: colors.infoMuted,
    borderColor: colors.info,
  },
  danger: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.error,
  },
  text: {
    ...typography.meta,
  },
  warningText: {
    color: colors.lost,
  },
  successText: {
    color: colors.found,
  },
  neutralText: {
    color: colors.textSecondary,
  },
  infoText: {
    color: colors.info,
  },
  dangerText: {
    color: colors.error,
  },
});
