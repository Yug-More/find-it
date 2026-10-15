import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { readFullName } from "../services/auth";

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fullName = readFullName(user);
  const email = user?.email?.trim() ?? "";

  async function handleSignOut() {
    setSubmitting(true);
    setFormError(null);
    const result = await signOut();
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.message);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.name}>
          {fullName ?? "Your account"}
        </Text>
        <Text style={styles.email}>
          {email || "Email is not available for this account."}
        </Text>
      </View>
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        label={submitting ? "Signing out" : "Sign out"}
        onPress={handleSignOut}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    ...typography.title,
    color: colors.text,
    flexShrink: 1,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
