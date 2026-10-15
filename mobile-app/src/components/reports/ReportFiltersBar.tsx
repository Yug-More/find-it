import { StyleSheet, Text, View } from "react-native";

import { CATEGORIES } from "../../constants/categories";
import { colors, spacing, typography } from "../../constants/theme";
import type { ReportFilters, ReportStatusFilter, ReportTypeFilter } from "../../types/report";
import { activeFilterCount, EMPTY_FILTERS, filterDateError } from "../../utils/filters";
import { Button } from "../ui/Button";
import { FilterChip } from "../ui/FilterChip";
import { SearchField } from "../ui/SearchField";
import { TextField } from "../ui/TextField";

type Props = {
  filters: ReportFilters;
  resultCount: number;
  onChange: (filters: ReportFilters) => void;
};

const TYPE_OPTIONS: { label: string; value: ReportTypeFilter }[] = [
  { label: "Any type", value: "all" },
  { label: "Lost items", value: "lost" },
  { label: "Found items", value: "found" },
];

const STATUS_OPTIONS: { label: string; value: ReportStatusFilter }[] = [
  { label: "Any status", value: "all" },
  { label: "Open reports", value: "open" },
  { label: "Resolved reports", value: "resolved" },
];

export function ReportFiltersBar({ filters, resultCount, onChange }: Props) {
  const active = activeFilterCount(filters);
  const dateError = filterDateError(filters);
  const countLabel = resultCount === 1 ? "1 report" : `${resultCount} reports`;

  function update(partial: Partial<ReportFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <View style={styles.bar}>
      <SearchField label="Search" value={filters.query} onChangeText={(query) => update({ query })} />
      <ChipRow
        label="Type"
        options={TYPE_OPTIONS}
        selected={filters.type}
        onSelect={(type) => update({ type })}
      />
      <ChipRow
        label="Category"
        options={[{ label: "Any category", value: "all" }, ...CATEGORIES.map((category) => ({ label: category, value: category }))]}
        selected={filters.category}
        onSelect={(category) => update({ category })}
      />
      <ChipRow
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onSelect={(status) => update({ status })}
      />
      <TextField
        label="Location contains"
        value={filters.location}
        onChangeText={(location) => update({ location })}
        autoCapitalize="words"
      />
      <TextField
        label="From date"
        value={filters.dateFrom}
        onChangeText={(dateFrom) => update({ dateFrom })}
        helper="YYYY-MM-DD"
        autoCapitalize="none"
        maxLength={10}
      />
      <TextField
        label="To date"
        value={filters.dateTo}
        onChangeText={(dateTo) => update({ dateTo })}
        helper="YYYY-MM-DD"
        autoCapitalize="none"
        maxLength={10}
        error={dateError ?? undefined}
      />
      <Text accessibilityLiveRegion="polite" style={styles.count}>
        {active > 0 ? `${countLabel}, ${active} ${active === 1 ? "filter" : "filters"}` : countLabel}
      </Text>
      <Button
        label="Clear filters"
        variant="text"
        onPress={() => onChange(EMPTY_FILTERS)}
        disabled={active === 0}
      />
    </View>
  );
}

function ChipRow<Value extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: Value }[];
  selected: Value;
  onSelect: (value: Value) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={option.value === selected}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  groupLabel: {
    ...typography.label,
    color: colors.text,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  count: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
