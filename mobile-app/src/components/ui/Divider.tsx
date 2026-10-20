import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../../constants/theme";

type Props = {
  inset?: boolean;
};

export function Divider({ inset = false }: Props) {
  return <View style={[styles.line, inset && styles.inset]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    width: "100%",
  },
  inset: {
    marginLeft: spacing.md,
  },
});
