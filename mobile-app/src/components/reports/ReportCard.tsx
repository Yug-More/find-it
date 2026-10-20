import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, elevation, iconSize, radius, spacing, touchTarget, typography } from "../../constants/theme";
import type { Report } from "../../types/report";
import { formatItemDate } from "../../utils/dates";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../ui/StatusBadge";
import { ReportImage } from "./ReportImage";

type Props = {
  report: Report;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ReportCard({ report, onPress, onEdit, onDelete }: Props) {
  const typeBadge = reportTypeBadge(report.type);
  const statusBadge = reportStatusBadge(report.status);
  const category = report.category ?? "No category";
  const location = report.location ?? "Location not provided";

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${report.title}, ${typeBadge.label}, ${category}, ${location}`}
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <ReportImage uri={report.imageUrl} label={`Photo of ${report.title}`} size="thumb" />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {report.title}
          </Text>
          <View style={styles.badges}>
            <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
            <StatusBadge label={category} tone="neutral" />
            <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {location}
          </Text>
          <Text style={styles.meta}>{formatItemDate(report.eventDate)}</Text>
        </View>
      </Pressable>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit"
              onPress={onEdit}
              style={styles.iconAction}
            >
              <Ionicons name="create-outline" size={iconSize.md} color={colors.accent} />
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete"
              onPress={onDelete}
              style={styles.iconAction}
            >
              <Ionicons name="trash-outline" size={iconSize.md} color={colors.error} />
              <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    ...elevation.soft,
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    flexShrink: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  iconAction: {
    flex: 1,
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  actionLabel: {
    ...typography.label,
    color: colors.accent,
  },
  deleteLabel: {
    color: colors.error,
  },
});
