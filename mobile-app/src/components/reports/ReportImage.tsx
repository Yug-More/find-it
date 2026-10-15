import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";

type Props = {
  uri: string | null;
  label: string;
  compact?: boolean;
};

export function ReportImage({ uri, label, compact = false }: Props) {
  if (!uri) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={`${label}. No photo`}
        style={[styles.placeholder, compact && styles.compact]}
      >
        <Text style={styles.placeholderText}>No photo</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.image, compact && styles.compact]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 200,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
  },
  placeholder: {
    width: "100%",
    height: 200,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  compact: {
    height: 120,
  },
  placeholderText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
