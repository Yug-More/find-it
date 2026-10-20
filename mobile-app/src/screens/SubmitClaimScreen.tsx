import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { SectionHeading } from "../components/ui/SectionHeading";
import { TextField } from "../components/ui/TextField";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { submitClaim } from "../services/claims";
import type { ClaimFieldErrors } from "../types/claim";
import { hasClaimErrors, validateClaimInput } from "../utils/claimValidation";

const PROMPTS = [
  "What unique marks, stickers, or damage help identify the item?",
  "Where and when did you last have it?",
  "What brand, color, or contents should the owner recognize?",
];

export function SubmitClaimScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "SubmitClaim">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, user } = useAuth();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ClaimFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showErrors = useRef(false);
  const messageRef = useRef("");

  function updateMessage(value: string) {
    messageRef.current = value;
    setMessage(value);
    if (showErrors.current) {
      setErrors(validateClaimInput({ message: value }));
    }
  }

  async function handleSubmit() {
    const input = { message: messageRef.current.trim() };
    const nextErrors = validateClaimInput(input);
    showErrors.current = true;
    messageRef.current = input.message;
    setMessage(input.message);
    setErrors(nextErrors);
    setFormError(null);
    if (hasClaimErrors(nextErrors) || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await submitClaim(route.params.reportId, input, session?.access_token, user?.id);
      navigation.replace("Claims");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The claim could not be submitted.");
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.intro}>
        Tell the report owner why this item belongs to you. The API stores one ownership
        explanation. Structured verification questions are not available yet.
      </Text>
      <SectionHeading title="Helpful details" />
      <View style={styles.prompts}>
        {PROMPTS.map((prompt) => (
          <Text key={prompt} style={styles.prompt}>
            {prompt}
          </Text>
        ))}
      </View>
      <TextField
        label="Ownership explanation"
        required
        value={message}
        onChangeText={updateMessage}
        error={errors.message}
        multiline
        editable={!submitting}
        maxLength={1000}
        helper="Write at least a short paragraph the owner can verify."
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        label={submitting ? "Submitting claim" : "Submit claim"}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
  prompts: {
    gap: spacing.sm,
  },
  prompt: {
    ...typography.body,
    color: colors.text,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
