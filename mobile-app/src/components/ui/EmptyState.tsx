import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";

type Props = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
