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
  const { configError, authMessage, setPendingReportType } = useAuth();

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
        <Text style={styles.description}>
          Report lost and found items in one place and reconnect people with their belongings.
        </Text>
        <Text style={styles.note}>
          An account is required to submit a report. You can browse reports without one.
        </Text>
      </View>
      {configError ? (
        <Text accessibilityRole="alert" style={styles.warning}>
          {configError}
        </Text>
      ) : null}
      {authMessage ? (
        <Text accessibilityRole="alert" style={styles.warning}>
          {authMessage}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label="Report a lost item" onPress={() => openReport("lost")} />
        <Button
          label="Report a found item"
          variant="secondary"
          onPress={() => openReport("found")}
        />
        <Button
          label="Browse reports"
          variant="text"
          onPress={() => navigation.navigate("Reports")}
        />
        <Button
          label="Sign in"
          onPress={() => {
            setPendingReportType(null);
            navigation.navigate("SignIn");
          }}
        />
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => navigation.navigate("SignUp")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  note: {
    ...typography.body,
    color: colors.text,
  },
  warning: {
    ...typography.body,
    color: colors.warning,
  },
  actions: {
    gap: spacing.sm,
  },
});
