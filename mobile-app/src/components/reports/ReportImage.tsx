import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";

type Size = "hero" | "field" | "thumb";

type Props = {
  uri: string | null;
  label: string;
  size?: Size;
};

export function ReportImage({ uri, label, size = "hero" }: Props) {
  const frame = size === "thumb" ? styles.thumb : size === "field" ? styles.field : styles.hero;

  if (!uri) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={`${label}. No photo`}
        style={[styles.placeholder, frame]}
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
      style={[styles.image, frame]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
  },
  placeholder: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  hero: {
    width: "100%",
    height: 200,
  },
  field: {
    width: "100%",
    height: 140,
  },
  thumb: {
    width: 96,
    height: 96,
  },
  placeholderText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
