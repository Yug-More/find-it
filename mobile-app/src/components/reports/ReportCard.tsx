import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, elevation, radius, spacing, typography } from "../../constants/theme";
import type { Report } from "../../types/report";
import { formatItemDate } from "../../utils/dates";
import { Button } from "../ui/Button";
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
      <Text style={styles.preview} numberOfLines={2}>
        {report.description}
      </Text>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? (
            <View style={styles.action}>
              <Button label="Edit" variant="outline" onPress={onEdit} />
            </View>
          ) : null}
          {onDelete ? (
            <View style={styles.action}>
              <Button label="Delete" variant="destructive" onPress={onDelete} />
            </View>
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
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    flexShrink: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  meta: {
    ...typography.body,
    color: colors.text,
  },
  preview: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
