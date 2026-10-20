import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
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
          Report lost and found items, review likely matches, and manage ownership claims in one
          place.
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
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button
              label="Browse reports"
              variant="outline"
              onPress={() => navigation.navigate("Reports")}
            />
          </View>
          <View style={styles.rowItem}>
            <Button
              label="My reports"
              variant="outline"
              onPress={() => navigation.navigate("MyReports")}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button
              label="Matches"
              variant="outline"
              onPress={() => navigation.navigate("Matches")}
            />
          </View>
          <View style={styles.rowItem}>
            <Button label="Claims" variant="outline" onPress={() => navigation.navigate("Claims")} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button
              label="Notifications"
              variant="text"
              onPress={() => navigation.navigate("Notifications")}
            />
          </View>
          <View style={styles.rowItem}>
            <Button
              label="Profile"
              variant="text"
              onPress={() => navigation.navigate("Profile")}
            />
          </View>
        </View>
      </View>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.panelTitle}>
          How FindIt works
        </Text>
        <Text style={styles.step}>1. Report an item as lost or found.</Text>
        <Text style={styles.step}>2. Browse reports and review likely matches.</Text>
        <Text style={styles.step}>3. Submit or decide ownership claims when needed.</Text>
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
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
