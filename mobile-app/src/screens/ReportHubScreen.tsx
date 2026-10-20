import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

export function ReportHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen includeTop scroll>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          New report
        </Text>
        <Text style={styles.subtitle}>
          Choose whether you lost something or found an item that may belong to someone else.
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
});
