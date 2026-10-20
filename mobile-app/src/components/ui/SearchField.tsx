import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  controlHeight,
  iconSize,
  radius,
  spacing,
  typography,
} from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchField({ label, value, onChangeText }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons
          name="search"
          size={iconSize.md}
          color={colors.textMuted}
          style={styles.icon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Name, color, brand, or place"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xxs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: controlHeight,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  icon: {
    marginTop: 1,
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    paddingVertical: spacing.xs,
  },
});
