import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";

type Props = {
  title: string;
  children: ReactNode;
  description?: string;
};

export function FormSection({ title, description, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.xxs,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  body: {
    gap: spacing.md,
  },
});
