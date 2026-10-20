import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
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
  action: {
    marginTop: spacing.xs,
    alignSelf: "stretch",
  },
});
