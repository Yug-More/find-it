import { StyleSheet, Text, View } from "react-native";

import { colors, layout, radius, spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View accessibilityViewIsModal style={styles.backdrop}>
      <View style={styles.dialog}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button label="Cancel" variant="outline" onPress={onCancel} disabled={busy} />
        <Button label={confirmLabel} variant="destructive" onPress={onConfirm} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: "rgba(27, 36, 48, 0.4)",
  },
  dialog: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.text,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
