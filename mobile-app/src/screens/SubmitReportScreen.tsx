import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportForm } from "../components/reports/ReportForm";
import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { shouldUseMockData } from "../services/config";
import { createReport } from "../services/reports";
import type { Report, ReportInput } from "../types/report";

export function SubmitReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "SubmitReport">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Report | null>(null);

  async function handleSubmit(input: ReportInput) {
    setSubmitting(true);
    setServerError(null);
    try {
      setSubmitted(await createReport(input));
    } catch (caught) {
      setServerError(
        caught instanceof Error ? caught.message : "The report could not be submitted.",
      );
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

  return (
    <Screen scroll>
      <ReportForm
        initialType={route.params.type}
        submitting={submitting}
        serverError={serverError}
        onSubmit={(input) => {
          void handleSubmit(input);
        }}
      />
    </Screen>
  );
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
