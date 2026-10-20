import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ClaimCard } from "../components/claims/ClaimCard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { colors, layout, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { listClaimsForUser, setClaimStatus } from "../services/claims";
import { listReports } from "../services/reports";
import type { Claim, ClaimStatus } from "../types/claim";

type PendingDecision = {
  claim: Claim;
  status: ClaimStatus;
};

export function ClaimsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!user?.id) {
        setError("Sign in to view claims.");
        setLoading(false);
        return;
      }
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const [nextClaims, reports] = await Promise.all([
          listClaimsForUser(session?.access_token, user.id),
          listReports(),
        ]);
        setClaims(nextClaims);
        setOwnedIds(
          new Set(reports.filter((report) => report.userId === user.id).map((report) => report.id)),
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Claims could not be loaded.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session, user],
  );

  useFocusEffect(
    useCallback(() => {
      void load("initial");
    }, [load]),
  );

  async function confirmDecision() {
    if (!pending || busy) {
      return;
    }
    setBusy(true);
    setDecisionError(null);
    try {
      await setClaimStatus(pending.claim.id, pending.status, session?.access_token, user?.id);
      setPending(null);
      await load("refresh");
    } catch (caught) {
      setDecisionError(caught instanceof Error ? caught.message : "The claim could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !refreshing) {
    return <LoadingState message="Loading claims" />;
  }

  if (error && claims.length === 0) {
    return <ErrorState message={error} onRetry={() => void load("initial")} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.listView}
        data={claims}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No claims yet"
            message="Claims you submit and claims on reports you own will appear here."
          />
        }
        renderItem={({ item }) => {
          const canDecide = ownedIds.has(item.itemId);
          return (
            <ClaimCard
              claim={item}
              canDecide={canDecide}
              busy={busy}
              onOpenReport={() =>
                navigation.navigate("ReportDetails", {
                  reportId: item.itemId,
                  origin: canDecide ? "mine" : "browse",
                })
              }
              onApprove={() => {
                setDecisionError(null);
                setPending({ claim: item, status: "approved" });
              }}
              onReject={() => {
                setDecisionError(null);
                setPending({ claim: item, status: "rejected" });
              }}
            />
          );
        }}
      />
      <ConfirmDialog
        visible={pending !== null}
        title={pending?.status === "approved" ? "Approve this claim?" : "Reject this claim?"}
        message={
          pending
            ? pending.status === "approved"
              ? `Approve the claim for ${pending.claim.itemTitle ?? "this report"}? The report will be marked resolved.`
              : `Reject the claim for ${pending.claim.itemTitle ?? "this report"}?`
            : ""
        }
        confirmLabel={
          busy ? "Saving" : pending?.status === "approved" ? "Approve" : "Reject"
        }
        confirmVariant={pending?.status === "approved" ? "primary" : "destructive"}
        busy={busy}
        error={decisionError}
        onCancel={() => {
          if (!busy) {
            setPending(null);
            setDecisionError(null);
          }
        }}
        onConfirm={() => {
          void confirmDecision();
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
  listView: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm + spacing.xs,
    flexGrow: 1,
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
});
