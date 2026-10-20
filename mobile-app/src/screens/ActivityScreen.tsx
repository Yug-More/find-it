import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Divider } from "../components/ui/Divider";
import { ListRow } from "../components/ui/ListRow";
import { Screen } from "../components/ui/Screen";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

export function ActivityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen includeTop scroll>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Activity
        </Text>
        <Text style={styles.subtitle}>Matches, claims, and notifications for your reports.</Text>
      </View>
      <View style={styles.group}>
        <ListRow
          label="Matches"
          description="Similar reports for items you submitted"
          icon="git-compare-outline"
          onPress={() => navigation.navigate("Matches")}
        />
        <Divider inset />
        <ListRow
          label="Claims"
          description="Ownership requests to review or track"
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
  header: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
