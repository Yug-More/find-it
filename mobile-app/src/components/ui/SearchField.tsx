import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, touchTarget, typography } from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchField({ label, value, onChangeText }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Name, color, brand, or place"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
});
