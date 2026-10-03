import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen includeTop scroll>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          FindIt
        </Text>
        <Text style={styles.description}>
          Report lost and found items in one place and reconnect people with their belongings.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          label="Report a lost item"
          onPress={() => navigation.navigate("SubmitReport", { type: "lost" })}
        />
        <Button
          label="Report a found item"
          variant="secondary"
          onPress={() => navigation.navigate("SubmitReport", { type: "found" })}
        />
        <Button
          label="Browse reports"
          variant="text"
          onPress={() => navigation.navigate("Reports")}
        />
      </View>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.panelTitle}>
          How FindIt works
        </Text>
        <Text style={styles.step}>1. Report an item as lost or found.</Text>
        <Text style={styles.step}>2. Browse reports in one list.</Text>
        <Text style={styles.step}>3. Open a report to see its details.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text,
  },
  step: {
    ...typography.body,
    color: colors.text,
  },
});
