import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";
import type { ItemStatus, ItemType } from "../../types/report";

type Tone = "neutral" | "warning" | "success";

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
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === "warning" && styles.warningText,
          tone === "success" && styles.successText,
          tone === "neutral" && styles.neutralText,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: colors.warningMuted,
    borderColor: colors.warning,
  },
  success: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  neutral: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  text: {
    ...typography.label,
  },
  warningText: {
    color: colors.warning,
  },
  successText: {
    color: colors.success,
  },
  neutralText: {
    color: colors.text,
  },
});
