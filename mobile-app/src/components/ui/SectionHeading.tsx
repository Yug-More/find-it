import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeading({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
