import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  colors,
  controlHeight,
  radius,
  spacing,
  typography,
} from "../../constants/theme";

type Variant = "primary" | "secondary" | "outline" | "text" | "destructive" | "tertiary";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  compact = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        variant === "text" && styles.text,
        variant === "tertiary" && styles.tertiary,
        variant === "destructive" && styles.destructive,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          (variant === "primary" || variant === "destructive") && styles.onAccentLabel,
          (variant === "secondary" ||
            variant === "outline" ||
            variant === "text" ||
            variant === "tertiary") &&
            styles.accentLabel,
          variant === "tertiary" && styles.tertiaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    minHeight: controlHeight,
    width: "100%",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compact: {
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.accentMuted,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tertiary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: colors.error,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.button,
    textAlign: "center",
  },
  onAccentLabel: {
    color: colors.white,
  },
  accentLabel: {
    color: colors.accent,
  },
  tertiaryLabel: {
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
