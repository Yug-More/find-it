import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ClaimCard } from "../components/claims/ClaimCard";
import { MatchCard } from "../components/matches/MatchCard";
import { ReportImage } from "../components/reports/ReportImage";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Divider } from "../components/ui/Divider";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { Screen } from "../components/ui/Screen";
import { SectionHeading } from "../components/ui/SectionHeading";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../components/ui/StatusBadge";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useReport } from "../hooks/useReports";
import type { RootStackParamList } from "../navigation/types";
import { listClaimsForItem } from "../services/claims";
import { listMatchesForReport } from "../services/matches";
import { deleteReport } from "../services/reports";
import type { Claim } from "../types/claim";
import type { MatchResult } from "../types/match";
import { formatCreatedAt, formatItemDate } from "../utils/dates";
import { ownsReport } from "../utils/ownership";

export function ReportDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ReportDetails">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const { report, loading, error, retry } = useReport(route.params.reportId);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sideError, setSideError] = useState<string | null>(null);
  const owner = report ? ownsReport(user?.id, report.userId) : false;
  const canClaim = Boolean(session && user && report && report.status === "open" && !owner);

  const loadSideData = useCallback(async () => {
    if (!report) {
      return;
    }
    setSideError(null);
    try {
      const nextMatches = await listMatchesForReport(report.id);
      setMatches(
        nextMatches.map((match) => ({
          ...match,
          sourceReportId: report.id,
          sourceTitle: report.title,
        })),
      );
      if (owner && user?.id) {
        setClaims(await listClaimsForItem(report.id, session?.access_token, user.id));
      } else {
        setClaims([]);
      }
    } catch (caught) {
      setSideError(caught instanceof Error ? caught.message : "Related data could not be loaded.");
    }
  }, [owner, report, session, user]);

  useFocusEffect(
    useCallback(() => {
      if (report) {
        void loadSideData();
      }
    }, [loadSideData, report]),
  );

  async function confirmDelete() {
    if (!report || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteReport(report.id, session?.access_token, user?.id);
      navigation.navigate(route.params.origin === "mine" ? "MyReports" : "Reports");
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "The report could not be deleted.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading report" />;
  }

  if (error || !report) {
    return (
      <ErrorState
        message={error ?? "That report could not be found."}
        onRetry={() => void retry()}
      />
    );
  }

  const typeBadge = reportTypeBadge(report.type);
  const statusBadge = reportStatusBadge(report.status);
  const dateLabel = report.type === "lost" ? "Date lost" : "Date found";

  return (
    <View style={styles.screen}>
      <Screen scroll>
        <ReportImage uri={report.imageUrl} label={`Photo of ${report.title}`} />

        <View style={styles.badges}>
          <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
          <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
          <StatusBadge label={report.category ?? "No category"} tone="neutral" />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          {report.title}
        </Text>

        <View style={styles.metaBlock}>
          <MetaRow label="Location" value={report.location ?? "Not provided"} />
          <Divider />
          <MetaRow label={dateLabel} value={formatItemDate(report.eventDate)} />
          <Divider />
          <MetaRow label="Submitted" value={formatCreatedAt(report.createdAt)} />
          {(report.color || report.brand) && (
            <>
              <Divider />
              <MetaRow
                label="Details"
                value={[report.color, report.brand].filter(Boolean).join(" · ") || "Not provided"}
              />
            </>
          )}
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        {canClaim ? (
          <Button
            label="Claim this item"
            onPress={() => navigation.navigate("SubmitClaim", { reportId: report.id })}
            disabled={deleting}
          />
        ) : null}

        {owner ? (
          <View style={styles.ownerActions}>
            <Button
              label="Edit report"
              variant="outline"
              onPress={() => navigation.navigate("EditReport", { reportId: report.id })}
              disabled={deleting}
            />
            <Button
              label="Delete report"
              variant="destructive"
              onPress={() => {
                setDeleteError(null);
                setConfirming(true);
              }}
              disabled={deleting}
            />
          </View>
        ) : null}

        <SectionHeading
          title="Possible matches"
          subtitle="Match confidence is an estimate based on available report details."
        />
        {sideError ? (
          <Text accessibilityRole="alert" style={styles.sideError}>
            {sideError}
          </Text>
        ) : null}
        {matches.length === 0 ? (
          <Text style={styles.emptyNote}>No similar reports are available for this item yet.</Text>
        ) : (
          <View style={styles.stack}>
            {matches.map((match) => (
              <MatchCard
                key={`${match.sourceReportId}-${match.report.id}`}
                match={match}
                onPress={() =>
                  navigation.push("ReportDetails", {
                    reportId: match.report.id,
                    origin: route.params.origin,
                  })
                }
              />
            ))}
          </View>
        )}

        {owner ? (
          <>
            <SectionHeading title="Claims" />
            {claims.length === 0 ? (
              <Text style={styles.emptyNote}>No claims have been submitted for this report.</Text>
            ) : (
              <View style={styles.stack}>
                {claims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={{ ...claim, itemTitle: report.title }}
                    onOpenReport={() => navigation.navigate("Claims")}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </Screen>
      <ConfirmDialog
        visible={confirming}
        title="Delete this report?"
        message={`Delete ${report.title}? This removes the report from FindIt.`}
        confirmLabel={deleting ? "Deleting" : "Delete"}
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          if (!deleting) {
            setConfirming(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
    flexShrink: 1,
  },
  metaBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  metaRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  descriptionBlock: {
    gap: spacing.xxs,
  },
  descriptionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.text,
  },
  ownerActions: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  emptyNote: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sideError: {
    ...typography.body,
    color: colors.error,
  },
});
