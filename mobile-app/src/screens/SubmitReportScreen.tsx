import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportForm } from "../components/reports/ReportForm";
import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { shouldUseMockData } from "../services/config";
import { ReportServiceError } from "../services/errors";
import { createReport } from "../services/reports";
import type { Report, ReportInput } from "../types/report";

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Sign in again to submit this report.";

export function SubmitReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "SubmitReport">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Report | null>(null);

  async function handleSubmit(input: ReportInput) {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setServerError(SESSION_EXPIRED_MESSAGE);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      setSubmitted(await createReport(input, accessToken));
    } catch (caught) {
      setServerError(submissionMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Screen scroll>
        <View accessibilityRole="summary" style={styles.success}>
          <Text accessibilityRole="header" style={styles.title}>
            Report submitted
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {submitted.title} was added to the reports list.
          </Text>
          {shouldUseMockData() ? (
            <Text style={styles.note}>
              This copy stays on this device. It was not sent to the server.
            </Text>
          ) : null}
        </View>
        <Button
          label="View this report"
          onPress={() => navigation.navigate("ReportDetails", { reportId: submitted.id })}
        />
        <Button
          label="Browse reports"
          variant="secondary"
          onPress={() => navigation.navigate("Reports")}
        />
      </Screen>
    );
  }

  if (!session?.access_token) {
    return (
      <Screen scroll>
        <View style={styles.success}>
          <Text accessibilityRole="header" style={styles.title}>
            Sign in required
          </Text>
          <Text accessibilityRole="alert" style={styles.body}>
            {SESSION_EXPIRED_MESSAGE}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ReportForm
        initialType={route.params.type}
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

function submissionMessage(caught: unknown): string {
  if (caught instanceof ReportServiceError && caught.kind === "authentication") {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }
  return "The report could not be submitted.";
}

const styles = StyleSheet.create({
  success: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
