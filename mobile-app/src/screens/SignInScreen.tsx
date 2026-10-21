import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { TextField } from "../components/ui/TextField";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import type { SignInFieldErrors } from "../types/auth";
import { hasAuthErrors, validateSignIn } from "../utils/authValidation";

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SignIn">>();
  const { signIn, configError, authMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showErrors = useRef(false);
  const valuesRef = useRef({ email: "", password: "" });

  function update(partial: { email?: string; password?: string }) {
    const next = { ...valuesRef.current, ...partial };
    valuesRef.current = next;
    setEmail(next.email);
    setPassword(next.password);
    if (showErrors.current) {
      setErrors(validateSignIn(next));
    }
  }

  async function handleSubmit() {
    const current = valuesRef.current;
    const input = { email: current.email.trim(), password: current.password };
    const nextErrors = validateSignIn(input);
    showErrors.current = true;
    valuesRef.current = { ...current, email: input.email };
    setEmail(input.email);
    setErrors(nextErrors);
    setFormError(null);
    if (hasAuthErrors(nextErrors) || configError || submitting) {
      return;
    }

    setSubmitting(true);
    const result = await signIn(input.email, input.password);
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.message);
    }
  }

  const notice = route.params?.notice;

  return (
    <Screen scroll>
      <Text style={styles.intro}>Sign in with the email and password for your FindIt account.</Text>
      {notice ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {notice}
        </Text>
      ) : null}
      {authMessage && authMessage !== notice ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {authMessage}
        </Text>
      ) : null}
      {configError ? (
        <View style={styles.configBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            {configError}
          </Text>
        </View>
      ) : null}
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
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        canReveal
        autoComplete="password"
        textContentType="password"
        editable={!submitting}
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        label={submitting ? "Signing in" : "Sign in"}
        onPress={handleSubmit}
        disabled={submitting || Boolean(configError)}
      />
      <Button
        label="Create account"
        variant="text"
        onPress={() => navigation.navigate("SignUp")}
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
  notice: {
    ...typography.body,
    color: colors.warning,
  },
  configBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
