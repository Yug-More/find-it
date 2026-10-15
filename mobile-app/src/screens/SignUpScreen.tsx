import { useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { TextField } from "../components/ui/TextField";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import type { SignUpFieldErrors, SignUpInput } from "../types/auth";
import { hasAuthErrors, PASSWORD_MIN_LENGTH, validateSignUp } from "../utils/authValidation";

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp, configError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const showErrors = useRef(false);
  const valuesRef = useRef<SignUpInput>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function update(next: Partial<SignUpInput>) {
    const input = { ...valuesRef.current, ...next };
    valuesRef.current = input;
    setFullName(input.fullName);
    setEmail(input.email);
    setPassword(input.password);
    setConfirmPassword(input.confirmPassword);
    if (showErrors.current) {
      setErrors(validateSignUp(input));
    }
  }

  async function handleSubmit() {
    const current = valuesRef.current;
    const input: SignUpInput = {
      fullName: current.fullName.trim(),
      email: current.email.trim(),
      password: current.password,
      confirmPassword: current.confirmPassword,
    };
    valuesRef.current = { ...current, fullName: input.fullName, email: input.email };
    const nextErrors = validateSignUp(input);
    showErrors.current = true;
    setFullName(input.fullName);
    setEmail(input.email);
    setErrors(nextErrors);
    setFormError(null);
    if (hasAuthErrors(nextErrors) || configError || submitting) {
      return;
    }

    setSubmitting(true);
    const result = await signUp(input);
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.message);
      return;
    }
    if (result.needsEmailConfirmation) {
      setSubmitting(false);
      setConfirmationEmail(input.email);
    }
  }

  if (confirmationEmail) {
    return (
      <Screen scroll>
        <Text accessibilityRole="header" style={styles.title}>
          Check your email
        </Text>
        <Text style={styles.body}>
          Your account was created. Check {confirmationEmail} to confirm it, then sign in.
        </Text>
        <Button label="Back to sign in" onPress={() => navigation.navigate("SignIn")} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.intro}>Create an account to submit a lost or found report.</Text>
      {configError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {configError}
        </Text>
      ) : null}
      <TextField
        label="Full name"
        required
        value={fullName}
        onChangeText={(value) => update({ fullName: value })}
        error={errors.fullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={!submitting}
        maxLength={80}
      />
      <TextField
        label="Email"
        required
        value={email}
        onChangeText={(value) => update({ email: value })}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!submitting}
      />
      <TextField
        label="Password"
        required
        value={password}
        onChangeText={(value) => update({ password: value })}
        error={errors.password}
        helper={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!submitting}
      />
      <TextField
        label="Confirm password"
        required
        value={confirmPassword}
        onChangeText={(value) => update({ confirmPassword: value })}
        error={errors.confirmPassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!submitting}
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        label={submitting ? "Creating account" : "Create account"}
        onPress={handleSubmit}
        disabled={submitting || Boolean(configError)}
      />
      <Button
        label="Sign in"
        variant="text"
        onPress={() => navigation.navigate("SignIn")}
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
  title: {
    ...typography.title,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
