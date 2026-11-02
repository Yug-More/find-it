import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { claimStatusLabel, claimStatusTone } from "../components/claims/ClaimCard";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState } from "../components/ui/ErrorState";
import { FilterChip } from "../components/ui/FilterChip";
import { LoadingState } from "../components/ui/LoadingState";
import { Screen } from "../components/ui/Screen";
import { SectionHeading } from "../components/ui/SectionHeading";
import {
  reportStatusBadge,
  reportTypeBadge,
  StatusBadge,
} from "../components/ui/StatusBadge";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import {
  deleteAdminItem,
  listAdminClaims,
  listAdminItems,
  listAdminUsers,
  updateAdminItemStatus,
} from "../services/admin";
import type { Profile } from "../types/auth";
import type { Claim } from "../types/claim";
import type { Report } from "../types/report";
import { formatCreatedAt, formatItemDate } from "../utils/dates";

type Section = "reports" | "users" | "claims";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "reports", label: "Reports" },
  { key: "users", label: "Users" },
  { key: "claims", label: "Claims" },
];

export function AdminScreen() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [section, setSection] = useState<Section>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Report | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Admin controls require a live API session.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const [nextReports, nextUsers, nextClaims] = await Promise.all([
        listAdminItems(token),
        listAdminUsers(token),
        listAdminClaims(token),
      ]);
      setReports(nextReports);
      setUsers(nextUsers);
      setClaims(nextClaims);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function changeStatus(report: Report, status: "open" | "resolved") {
    if (!token || busyId) {
      return;
    }
    setBusyId(report.id);
    setActionError(null);
    try {
      const updated = await updateAdminItemStatus(report.id, status, token);
      setReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The report could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !token || busyId) {
      return;
    }
    setBusyId(pendingDelete.id);
    setDeleteError(null);
    try {
      await deleteAdminItem(pendingDelete.id, token);
      setReports((current) => current.filter((item) => item.id !== pendingDelete.id));
      setClaims((current) => current.filter((claim) => claim.itemId !== pendingDelete.id));
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "The report could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  function displayUser(userId: string): string {
    const profile = users.find((item) => item.id === userId);
    if (!profile) {
      return userId;
    }
    return profile.fullName ? `${profile.fullName} (${profile.email})` : profile.email;
  }

  if (loading && reports.length === 0 && users.length === 0 && claims.length === 0) {
    return <LoadingState message="Loading admin controls" />;
  }

  if (error && reports.length === 0 && users.length === 0 && claims.length === 0) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  return (
    <View style={styles.screen}>
      <Screen scroll>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Admin controls
          </Text>
          <Text style={styles.subtitle}>
            Server-verified admin session. Actions apply immediately.
          </Text>
        </View>

        <View style={styles.chips}>
          {SECTIONS.map((item) => (
            <FilterChip
              key={item.key}
              label={item.label}
              selected={section === item.key}
              onPress={() => setSection(item.key)}
            />
          ))}
        </View>

        <Button
          label={loading ? "Refreshing" : "Refresh"}
          variant="text"
          onPress={() => void load()}
          disabled={loading || busyId !== null}
        />

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {actionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {actionError}
          </Text>
        ) : null}

        {section === "reports" ? (
          <>
            <SectionHeading
              title={`Reports (${reports.length})`}
              subtitle="Every report, including resolved items."
            />
            {reports.length === 0 ? (
              <Text style={styles.emptyNote}>No reports have been submitted.</Text>
            ) : (
              reports.map((report) => {
                const typeBadge = reportTypeBadge(report.type);
                const statusBadge = reportStatusBadge(report.status);
                const busy = busyId === report.id;
                return (
                  <View key={report.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{report.title}</Text>
                      <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                    </View>
                    <View style={styles.badges}>
                      <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
                      <StatusBadge label={report.category ?? "No category"} tone="neutral" />
                    </View>
                    <Text style={styles.meta}>
                      {report.location ?? "Location not provided"} · {formatItemDate(report.eventDate)}
                    </Text>
                    <Text style={styles.meta}>Owner {displayUser(report.userId)}</Text>
                    <View style={styles.actions}>
                      <View style={styles.action}>
                        <Button
                          compact
                          label={report.status === "open" ? "Mark resolved" : "Reopen"}
                          variant="outline"
                          onPress={() =>
                            void changeStatus(report, report.status === "open" ? "resolved" : "open")
                          }
                          disabled={busy || busyId !== null}
                        />
                      </View>
                      <View style={styles.action}>
                        <Button
                          compact
                          label="Delete report"
                          variant="destructive"
                          onPress={() => {
                            setDeleteError(null);
                            setPendingDelete(report);
                          }}
                          disabled={busy || busyId !== null}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : null}

        {section === "users" ? (
          <>
            <SectionHeading
              title={`Users (${users.length})`}
              subtitle="Roles are promoted from the database, never from this app."
            />
            {users.length === 0 ? (
              <Text style={styles.emptyNote}>No profiles were found.</Text>
            ) : (
              users.map((profile) => (
                <View key={profile.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{profile.fullName ?? "Unnamed user"}</Text>
                    <StatusBadge
                      label={profile.role === "admin" ? "Admin" : "User"}
                      tone={profile.role === "admin" ? "info" : "neutral"}
                    />
                  </View>
                  <Text style={styles.meta}>{profile.email}</Text>
                  <Text style={styles.meta}>Joined {formatCreatedAt(profile.createdAt)}</Text>
                  <Text style={styles.meta}>Account {profile.id}</Text>
                </View>
              ))
            )}
          </>
        ) : null}

        {section === "claims" ? (
          <>
            <SectionHeading
              title={`Claims (${claims.length})`}
              subtitle="Read-only overview. Claim decisions stay with report owners."
            />
            {claims.length === 0 ? (
              <Text style={styles.emptyNote}>No claims have been submitted.</Text>
            ) : (
              claims.map((claim) => {
                const reportTitle =
                  reports.find((report) => report.id === claim.itemId)?.title ?? "Report";
                return (
                  <View key={claim.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{reportTitle}</Text>
                      <StatusBadge
                        label={claimStatusLabel(claim.status)}
                        tone={claimStatusTone(claim.status)}
                      />
                    </View>
                    <Text style={styles.claimMessage}>{claim.message}</Text>
                    <Text style={styles.meta}>Claimant {displayUser(claim.claimantId)}</Text>
                    <Text style={styles.meta}>Submitted {formatCreatedAt(claim.createdAt)}</Text>
                  </View>
                );
              })
            )}
          </>
        ) : null}
      </Screen>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete this report?"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.title}? Its claims and notifications are removed too.`
            : "Delete this report?"
        }
        confirmLabel={busyId === pendingDelete?.id ? "Deleting" : "Delete"}
        busy={busyId === pendingDelete?.id}
        error={deleteError}
        onCancel={() => {
          if (!busyId) {
            setPendingDelete(null);
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.xxs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  card: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  claimMessage: {
    ...typography.body,
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  action: {
    flex: 1,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
  emptyNote: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
