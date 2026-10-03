import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, touchTarget, typography } from "../../constants/theme";

type Choice = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  options: readonly Choice[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

export function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
}: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.requirement}>{required ? "Required" : "Optional"}</Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected && styles.optionSelected, disabled && styles.disabled]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  requirement: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    minHeight: touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});
