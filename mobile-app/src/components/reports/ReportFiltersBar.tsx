import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CATEGORIES } from "../../constants/categories";
import { colors, iconSize, radius, spacing, typography } from "../../constants/theme";
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
  { label: "Any", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

const STATUS_OPTIONS: { label: string; value: ReportStatusFilter }[] = [
  { label: "Any", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
];

export function ReportFiltersBar({ filters, resultCount, onChange }: Props) {
  const active = activeFilterCount(filters);
  const dateError = filterDateError(filters);
  const countLabel = resultCount === 1 ? "1 report" : `${resultCount} reports`;
  const [filtersOpen, setFiltersOpen] = useState(false);

  function update(partial: Partial<ReportFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <View style={styles.bar}>
      <SearchField label="Search" value={filters.query} onChangeText={(query) => update({ query })} />
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filtersOpen ? "Hide filters" : "Show filters"}
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen((open) => !open)}
          style={styles.filterToggle}
        >
          <Ionicons name="options-outline" size={iconSize.md} color={colors.text} />
          <Text style={styles.filterToggleLabel}>
            Filters{active > 0 ? ` (${active})` : ""}
          </Text>
          <Ionicons
            name={filtersOpen ? "chevron-up" : "chevron-down"}
            size={iconSize.sm}
            color={colors.textSecondary}
          />
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.count}>
          {active > 0
            ? `${countLabel}, ${active} ${active === 1 ? "filter" : "filters"}`
            : countLabel}
        </Text>
      </View>
      {active > 0 ? (
        <View style={styles.clearRow}>
          <Button label="Clear filters" variant="text" onPress={() => onChange(EMPTY_FILTERS)} />
        </View>
      ) : null}
      {filtersOpen ? (
        <View style={styles.panel}>
          <ChipRow
            label="Type"
            options={TYPE_OPTIONS}
            selected={filters.type}
            onSelect={(type) => update({ type })}
          />
          <ChipRow
            label="Category"
            options={[
              { label: "Any", value: "all" },
              ...CATEGORIES.map((category) => ({ label: category, value: category })),
            ]}
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
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TextField
                label="From"
                value={filters.dateFrom}
                onChangeText={(dateFrom) => update({ dateFrom })}
                helper="YYYY-MM-DD"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <TextField
                label="To"
                value={filters.dateTo}
                onChangeText={(dateTo) => update({ dateTo })}
                helper="YYYY-MM-DD"
                autoCapitalize="none"
                maxLength={10}
                error={dateError ?? undefined}
              />
            </View>
          </View>
          <Button
            label="Clear filters"
            variant="text"
            onPress={() => onChange(EMPTY_FILTERS)}
            disabled={active === 0}
          />
        </View>
      ) : null}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={option.value === selected}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  filterToggleLabel: {
    ...typography.label,
    color: colors.text,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: "right",
  },
  clearRow: {
    alignSelf: "flex-start",
  },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  group: {
    gap: spacing.xxs,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
});
