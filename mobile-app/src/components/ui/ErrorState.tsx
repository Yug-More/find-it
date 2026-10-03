import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type Props = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Something went wrong
      </Text>
      <Text accessibilityRole="alert" style={styles.message}>
        {message}
      </Text>
      <Button label="Retry" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.background,
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
