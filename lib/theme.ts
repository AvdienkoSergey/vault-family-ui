export type ColorPalette = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  shared: string
  sharedForeground: string
}

export const darkColors: ColorPalette = {
  background: "#111827",
  foreground: "#ECEEF4",
  card: "#1A1F2E",
  cardForeground: "#ECEEF4",
  primary: "#6366F1",
  primaryForeground: "#FAFAFA",
  secondary: "#242B3A",
  secondaryForeground: "#D8DAE3",
  muted: "#242B3A",
  mutedForeground: "#8D93A5",
  destructive: "#E5484D",
  destructiveForeground: "#FAFAFA",
  border: "#2E3547",
  input: "#242B3A",
  success: "#30A46C",
  successForeground: "#FAFAFA",
  warning: "#D4A900",
  warningForeground: "#1A1F2E",
  shared: "#3EA8DE",
  sharedForeground: "#FAFAFA",
}

export const lightColors: ColorPalette = {
  background: "#F5F7FA",
  foreground: "#111827",
  card: "#FFFFFF",
  cardForeground: "#111827",
  primary: "#6366F1",
  primaryForeground: "#FFFFFF",
  secondary: "#EEF1F6",
  secondaryForeground: "#4B5563",
  muted: "#EEF1F6",
  mutedForeground: "#6B7280",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  border: "#D5DAE3",
  input: "#EEF1F6",
  success: "#16A34A",
  successForeground: "#FFFFFF",
  warning: "#B45309",
  warningForeground: "#FFFFFF",
  shared: "#2563EB",
  sharedForeground: "#FFFFFF",
}

/** @deprecated Use useTheme().colors instead for dynamic theme support */
export const colors = darkColors

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
}

export function withOpacity(hexColor: string, opacity: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
