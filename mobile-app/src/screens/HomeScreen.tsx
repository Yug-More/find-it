import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Divider";
import { ListRow } from "../components/ui/ListRow";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen includeTop scroll includeBottom={false}>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          FindIt
        </Text>
        <Text style={styles.description}>
          Report an item, browse campus reports, and follow up on matches or claims.
        </Text>
      </View>

      <View style={styles.primary}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Report an item
        </Text>
        <Button
          label="Report a lost item"
          onPress={() => navigation.navigate("SubmitReport", { type: "lost" })}
        />
        <Button
          label="Report a found item"
          variant="secondary"
          onPress={() => navigation.navigate("SubmitReport", { type: "found" })}
        />
      </View>

      <View style={styles.group}>
        <ListRow
          label="Browse reports"
          description="Search and filter lost and found items"
          icon="search-outline"
          onPress={() => navigation.navigate("Reports")}
        />
        <Divider inset />
        <ListRow
          label="My reports"
          description="View, edit, or delete your submissions"
          icon="folder-outline"
          onPress={() => navigation.navigate("MyReports")}
        />
        <Divider inset />
        <ListRow
          label="Matches"
          description="Similar reports for your items"
          icon="git-compare-outline"
          onPress={() => navigation.navigate("Matches")}
        />
        <Divider inset />
        <ListRow
          label="Claims"
          description="Ownership requests and decisions"
          icon="shield-checkmark-outline"
          onPress={() => navigation.navigate("Claims")}
        />
        <Divider inset />
        <ListRow
          label="Notifications"
          description="Updates about matches and claims"
          icon="notifications-outline"
          onPress={() => navigation.navigate("Notifications")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  primary: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
