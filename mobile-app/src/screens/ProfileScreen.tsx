import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { ListRow } from "../components/ui/ListRow";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { readFullName } from "../services/auth";
import { shouldUseMockData } from "../services/config";
import { resetMockClaims } from "../services/mockClaims";
import { resetMockNotifications } from "../services/mockNotifications";
import { resetMockReports } from "../services/mockReports";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isDemoSession, signOut } = useAuth();
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
    <Screen includeTop scroll includeBottom={false}>
      <View style={styles.identity}>
        <Text style={styles.caption}>{isDemoSession ? "Demo account" : "Signed in"}</Text>
        <Text accessibilityRole="header" style={styles.name}>
          {fullName ?? "Your account"}
        </Text>
        <Text style={styles.email}>{email || "Email is not available for this account."}</Text>
      </View>

      <View style={styles.group}>
        <ListRow
          label="My reports"
          icon="folder-outline"
          onPress={() => navigation.navigate("MyReports")}
          disabled={submitting}
        />
        <Divider inset />
        <ListRow
          label="Claims"
          icon="shield-checkmark-outline"
          onPress={() => navigation.navigate("Claims")}
          disabled={submitting}
        />
        <Divider inset />
        <ListRow
          label="Notifications"
          icon="notifications-outline"
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
        variant="outline"
        onPress={handleSignOut}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
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
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
