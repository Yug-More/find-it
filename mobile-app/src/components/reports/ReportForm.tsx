import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CATEGORIES } from "../../constants/categories";
import { colors, spacing, typography } from "../../constants/theme";
import type { ItemType, ReportFieldErrors, ReportInput } from "../../types/report";
import { hasFieldErrors, normalizeReportInput, validateReportInput } from "../../utils/validation";
import { Button } from "../ui/Button";
import { ChoiceGroup } from "../ui/ChoiceGroup";
import { TextField } from "../ui/TextField";

const TYPE_OPTIONS = [
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
] as const;

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  label: category,
  value: category,
}));

type Props = {
  initialType: ItemType;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (input: ReportInput) => void;
};

const EMPTY_FORM: ReportInput = {
  type: "lost",
  title: "",
  category: "",
  description: "",
  color: "",
  location: "",
  eventDate: "",
};

export function ReportForm({ initialType, submitting, serverError, onSubmit }: Props) {
  const [values, setValues] = useState<ReportInput>({ ...EMPTY_FORM, type: initialType });
  const valuesRef = useRef(values);
  const [errors, setErrors] = useState<ReportFieldErrors>({});
  const showErrorsRef = useRef(false);

  useEffect(() => {
    const next = { ...valuesRef.current, type: initialType };
    valuesRef.current = next;
    setValues(next);
  }, [initialType]);

  function update<Key extends keyof ReportInput>(key: Key, value: ReportInput[Key]) {
    const next = { ...valuesRef.current, [key]: value };
    valuesRef.current = next;
    setValues(next);
    if (showErrorsRef.current) {
      setErrors(validateReportInput(next));
    }
  }

  function handleSubmit() {
    const current = valuesRef.current;
    const nextErrors = validateReportInput(current);
    showErrorsRef.current = true;
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors) || submitting) {
      return;
    }
    onSubmit(normalizeReportInput(current));
  }

  const dateLabel = values.type === "lost" ? "Date lost" : "Date found";

  return (
    <View style={styles.form}>
      <ChoiceGroup
        label="Report type"
        required
        options={TYPE_OPTIONS}
        value={values.type}
        onChange={(value) => update("type", value as ItemType)}
        error={errors.type}
        disabled={submitting}
      />
      <TextField
        label="Item name"
        required
        value={values.title}
        onChangeText={(value) => update("title", value)}
        error={errors.title}
        autoCapitalize="words"
        editable={!submitting}
        maxLength={120}
      />
      <ChoiceGroup
        label="Category"
        required
        options={CATEGORY_OPTIONS}
        value={values.category}
        onChange={(value) => update("category", value)}
        error={errors.category}
        disabled={submitting}
      />
      <TextField
        label="Description"
        required
        value={values.description}
        onChangeText={(value) => update("description", value)}
        error={errors.description}
        multiline
        editable={!submitting}
        maxLength={2000}
      />
      <TextField
        label="Color"
        value={values.color}
        onChangeText={(value) => update("color", value)}
        error={errors.color}
        autoCapitalize="words"
        editable={!submitting}
        maxLength={40}
      />
      <TextField
        label="Location"
        required
        value={values.location}
        onChangeText={(value) => update("location", value)}
        error={errors.location}
        autoCapitalize="words"
        editable={!submitting}
        maxLength={200}
      />
      <TextField
        label={dateLabel}
        required
        value={values.eventDate}
        onChangeText={(value) => update("eventDate", value)}
        error={errors.eventDate}
        helper="Use YYYY-MM-DD."
        autoCapitalize="none"
        editable={!submitting}
        maxLength={10}
      />
      {serverError ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {serverError}
        </Text>
      ) : null}
      <Button
        label={submitting ? "Submitting" : "Submit report"}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  serverError: {
    ...typography.body,
    color: colors.error,
  },
});
