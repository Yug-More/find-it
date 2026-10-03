export const colors = {
  background: "#F4F6F8",
  surface: "#FFFFFF",
  text: "#1B2430",
  textSecondary: "#3F4C5C",
  accent: "#1D4E89",
  accentPressed: "#163A66",
  accentMuted: "#E7EEF5",
  border: "#D5DCE3",
  error: "#9B2C2C",
  errorMuted: "#F8EEEE",
  warning: "#8A4B08",
  warningMuted: "#F8F1E7",
  success: "#17663F",
  successMuted: "#E7F4ED",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
} as const;

export const typography = {
  wordmark: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: "600" as const },
} as const;

export const touchTarget = 48;
