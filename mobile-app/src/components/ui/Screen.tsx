import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";

import { colors, layout, spacing } from "../../constants/theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  includeTop?: boolean;
  includeBottom?: boolean;
  padded?: boolean;
};

export function Screen({
  children,
  scroll = false,
  includeTop = false,
  includeBottom = true,
  padded = true,
}: Props) {
  const edges: Edges = [
    ...(includeTop ? (["top"] as const) : []),
    "right",
    ...(includeBottom ? (["bottom"] as const) : []),
    "left",
  ];

  const contentStyle = [styles.content, padded ? styles.padded : styles.unpadded];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
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
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
    gap: spacing.md,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  unpadded: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
