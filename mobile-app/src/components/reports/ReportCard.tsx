import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../constants/theme";
import type { Report } from "../../types/report";
import { formatItemDate } from "../../utils/dates";
import { reportStatusBadge, reportTypeBadge, StatusBadge } from "../ui/StatusBadge";

type Props = {
  report: Report;
  onPress: () => void;
};

export function ReportCard({ report, onPress }: Props) {
  const typeBadge = reportTypeBadge(report.type);
  const statusBadge = reportStatusBadge(report.status);
  const category = report.category ?? "No category";
  const location = report.location ?? "Location not provided";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${report.title}, ${typeBadge.label}, ${category}, ${location}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{report.title}</Text>
      <View style={styles.badges}>
        <StatusBadge label={typeBadge.label} tone={typeBadge.tone} />
        <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
      </View>
      <Text style={styles.meta}>{category}</Text>
      <Text style={styles.meta}>{location}</Text>
      <Text style={styles.meta}>{formatItemDate(report.eventDate)}</Text>
      <Text style={styles.preview} numberOfLines={2}>
        {report.description}
      </Text>
    </Pressable>
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
  },
  pressed: {
    backgroundColor: colors.accentMuted,
  },
  title: {
    ...typography.heading,
    color: colors.text,
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
