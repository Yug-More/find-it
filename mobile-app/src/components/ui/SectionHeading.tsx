import { StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "../../constants/theme";

type Props = {
  title: string;
};

export function SectionHeading({ title }: Props) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
