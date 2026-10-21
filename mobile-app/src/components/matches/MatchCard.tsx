import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, elevation, radius, spacing, typography } from "../../constants/theme";
import type { MatchResult } from "../../types/match";
import { formatItemDate } from "../../utils/dates";
import { confidenceTone, formatMatchConfidence } from "../../utils/confidence";
import { ReportImage } from "../reports/ReportImage";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../ui/StatusBadge";

type Props = {
  match: MatchResult;
  onPress: () => void;
};

export function MatchCard({ match, onPress }: Props) {
  const { report, similarity, sourceTitle } = match;
  const typeBadge = reportTypeBadge(report.type);
  const statusBadge = reportStatusBadge(report.status);
  const confidence = formatMatchConfidence(similarity);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${report.title}, ${confidence}${sourceTitle ? `, related to ${sourceTitle}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ReportImage uri={report.imageUrl} label={`Photo of ${report.title}`} size="thumb" />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {report.title}
          </Text>
          <StatusBadge label={confidence} tone={confidenceTone(similarity)} />
        </View>
        <View style={styles.badges}>
          <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
          <StatusBadge label={report.category ?? "No category"} tone="neutral" />
          <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
        </View>
        {sourceTitle ? (
          <Text style={styles.meta} numberOfLines={1}>
            Related to {sourceTitle}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {report.location ?? "Location not provided"}
        </Text>
        <Text style={styles.meta}>{formatItemDate(report.eventDate)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...elevation.soft,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  title: {
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
});
