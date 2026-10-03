import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";

import { colors, spacing } from "../../constants/theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  includeTop?: boolean;
};

export function Screen({ children, scroll = false, includeTop = false }: Props) {
  const edges: Edges = includeTop
    ? ["top", "right", "bottom", "left"]
    : ["right", "bottom", "left"];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
});
