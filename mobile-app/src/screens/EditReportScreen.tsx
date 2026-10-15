import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ReportForm } from "../components/reports/ReportForm";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { Screen } from "../components/ui/Screen";
import { colors, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useReport } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import { ReportServiceError } from "../services/errors";
import { updateReport } from "../services/reports";
import type { ReportInput } from "../types/report";
import { ownsReport } from "../utils/ownership";
import { reportToInput } from "../utils/reportForm";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Sign in again to save this report.";

export function EditReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "EditReport">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const { report, loading, error, retry } = useReport(route.params.reportId);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(input: ReportInput) {
    if (!session?.access_token || !user?.id) {
      setServerError(SESSION_EXPIRED_MESSAGE);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const updated = await updateReport(route.params.reportId, input, session.access_token, user.id);
      navigation.navigate("ReportDetails", { reportId: updated.id, origin: "mine" });
    } catch (caught) {
      setServerError(saveMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading report" />;
  }

  if (error || !report) {
    return (
      <ErrorState message={error ?? "That report could not be found."} onRetry={() => void retry()} />
    );
  }

  if (!ownsReport(user?.id, report.userId)) {
    return (
      <Screen scroll>
        <Text accessibilityRole="alert" style={styles.error}>
          You can only edit reports you created.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ReportForm
        initialType={report.type}
        initialValues={reportToInput(report)}
        submitting={submitting}
        submitLabel="Save changes"
        submittingLabel="Saving"
        serverError={serverError}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

function saveMessage(caught: unknown): string {
  if (caught instanceof ReportServiceError && caught.kind === "authentication") {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }
  return "The report could not be saved.";
}

const styles = StyleSheet.create({
  error: {
    ...typography.body,
    color: colors.error,
  },
});
