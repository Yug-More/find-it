import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, touchTarget, typography } from "../../constants/theme";

type Variant = "primary" | "secondary" | "outline" | "text" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        variant === "text" && styles.text,
        variant === "destructive" && styles.destructive,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.primaryLabel,
          (variant === "secondary" || variant === "outline" || variant === "text") && styles.secondaryLabel,
          variant === "destructive" && styles.primaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    opacity: 0.5,
  },
  label: {
    ...typography.button,
    textAlign: "center",
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.accent,
  },
});
