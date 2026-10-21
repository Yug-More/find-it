import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import type { ItemType } from "../types/report";

const ACCOUNT_REQUIRED =
  "An account is required to submit a report. Sign in to continue.";

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { configError, authMessage, mockMode, setPendingReportType, enterDemoSession } = useAuth();

  function openReport(type: ItemType) {
    setPendingReportType(type);
    navigation.navigate("SignIn", { notice: ACCOUNT_REQUIRED });
  }

  return (
    <Screen includeTop scroll>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          FindIt
        </Text>
        <Text style={styles.tagline}>Lost something? We can help you find it.</Text>
        <Text style={styles.description}>
          Report lost and found items, review likely matches, and manage ownership claims in one
          place.
        </Text>
      </View>

      {configError ? (
        <View style={styles.noticeBox}>
          <Text accessibilityRole="alert" style={styles.noticeTitle}>
            {mockMode ? "Live sign-in is not configured" : "Account setup needed"}
          </Text>
          <Text style={styles.noticeBody}>{configError}</Text>
          {mockMode ? (
            <Text style={styles.noticeBody}>
              Mock mode is on. Use Continue with demo account to review signed-in screens.
            </Text>
          ) : (
            <Text style={styles.noticeBody}>
              You can still browse reports. Submitting reports requires Supabase configuration.
            </Text>
          )}
        </View>
      ) : null}
      {authMessage ? (
        <Text accessibilityRole="alert" style={styles.warning}>
          {authMessage}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Sign in"
          onPress={() => {
            setPendingReportType(null);
            navigation.navigate("SignIn");
          }}
        />
        <Button label="Create account" variant="secondary" onPress={() => navigation.navigate("SignUp")} />
        <Button
          label="Browse reports"
          variant="outline"
          onPress={() => navigation.navigate("Reports")}
        />
        {mockMode ? (
          <Button
            label="Continue with demo account"
            variant="text"
            onPress={enterDemoSession}
          />
        ) : null}
      </View>

      <View style={styles.secondary}>
        <Text style={styles.secondaryLabel}>Need to file a report?</Text>
        <Button label="Report a lost item" variant="outline" onPress={() => openReport("lost")} />
        <Button
          label="Report a found item"
          variant="outline"
          onPress={() => openReport("found")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.text,
  },
  tagline: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  noticeBox: {
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeTitle: {
    ...typography.label,
    color: colors.warning,
  },
  noticeBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warning: {
    ...typography.body,
    color: colors.warning,
  },
  actions: {
    gap: spacing.sm,
  },
  secondary: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  secondaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
