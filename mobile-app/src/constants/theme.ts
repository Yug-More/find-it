export const colors = {
  background: "#F7F7F5",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accent: "#0F6E56",
  accentPressed: "#0B5542",
  accentMuted: "#E6F4EF",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  divider: "#EEF0F2",
  error: "#B42318",
  errorMuted: "#FEF3F2",
  warning: "#B54708",
  warningMuted: "#FFFAEB",
  success: "#067647",
  successMuted: "#ECFDF3",
  info: "#175CD3",
  infoMuted: "#EFF8FF",
  overlay: "rgba(17, 24, 39, 0.45)",
  white: "#FFFFFF",
  lost: "#B54708",
  lostMuted: "#FFFAEB",
  found: "#067647",
  foundMuted: "#ECFDF3",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  wordmark: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: "600" as const },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
} as const;

export const touchTarget = 48;
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const controlHeight = 48;

export const layout = {
  contentMaxWidth: 560,
  screenPadding: spacing.md,
  sectionGap: spacing.lg,
  headerHeight: 52,
} as const;

export const elevation = {
  none: {},
  soft: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;
