import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { readFullName } from "../services/auth";
import { resetMockClaims } from "../services/mockClaims";
import { resetMockNotifications } from "../services/mockNotifications";
import { resetMockReports } from "../services/mockReports";
import { shouldUseMockData } from "../services/config";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fullName = readFullName(user);
  const email = user?.email?.trim() ?? "";

  async function handleSignOut() {
    setSubmitting(true);
    setFormError(null);
    if (shouldUseMockData()) {
      resetMockReports();
      resetMockClaims();
      resetMockNotifications();
    }
    const result = await signOut();
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.message);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.panel}>
        <Text style={styles.caption}>Signed in</Text>
        <Text accessibilityRole="header" style={styles.name}>
          {fullName ?? "Your account"}
        </Text>
        <Text style={styles.email}>
          {email || "Email is not available for this account."}
        </Text>
      </View>
      <View style={styles.shortcuts}>
        <Button
          label="My reports"
          variant="outline"
          onPress={() => navigation.navigate("MyReports")}
          disabled={submitting}
        />
        <Button
          label="Claims"
          variant="outline"
          onPress={() => navigation.navigate("Claims")}
          disabled={submitting}
        />
        <Button
          label="Notifications"
          variant="outline"
          onPress={() => navigation.navigate("Notifications")}
          disabled={submitting}
        />
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
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
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
  shortcuts: {
    gap: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
