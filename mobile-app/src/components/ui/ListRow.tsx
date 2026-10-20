import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, iconSize, spacing, touchTarget, typography } from "../../constants/theme";

type Props = {
  label: string;
  description?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function ListRow({
  label,
  description,
  onPress,
  icon,
  disabled = false,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      {icon ? (
        <View style={styles.iconWrap} accessibilityElementsHidden>
          <Ionicons name={icon} size={iconSize.md} color={colors.accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
