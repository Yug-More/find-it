import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import {
  colors,
  controlHeight,
  radius,
  spacing,
  touchTarget,
  typography,
} from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  keyboardType?: TextInputProps["keyboardType"];
  secureTextEntry?: boolean;
  canReveal?: boolean;
  editable?: boolean;
  maxLength?: number;
};

export function TextField({
  label,
  value,
  onChangeText,
  required = false,
  error,
  helper,
  multiline = false,
  autoCapitalize = "sentences",
  autoCorrect = true,
  autoComplete,
  textContentType,
  keyboardType,
  secureTextEntry = false,
  canReveal = false,
  editable = true,
  maxLength,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const hidden = secureTextEntry && !revealed;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.requirement}>Required</Text> : null}
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
          keyboardType={keyboardType}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          accessibilityHint={required ? "Required" : undefined}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            canReveal && styles.inputWithReveal,
            multiline && styles.multiline,
            focused && !error && styles.inputFocused,
            error ? styles.inputError : null,
            !editable && styles.inputDisabled,
          ]}
        />
        {canReveal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((current) => !current)}
            style={styles.revealButton}
            hitSlop={8}
          >
            <Text style={styles.reveal}>{revealed ? "Hide" : "Show"}</Text>
          </Pressable>
        ) : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
    flexShrink: 1,
  },
  requirement: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 0,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  revealButton: {
    position: "absolute",
    right: spacing.xxs,
    top: 0,
    bottom: 0,
    minWidth: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  reveal: {
    ...typography.label,
    color: colors.accent,
  },
  input: {
    minHeight: controlHeight,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputWithReveal: {
    paddingRight: touchTarget + spacing.md,
  },
  multiline: {
    minHeight: 120,
    paddingTop: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorMuted,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});
